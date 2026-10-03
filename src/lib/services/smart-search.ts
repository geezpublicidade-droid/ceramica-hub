import { createServiceClient } from "@/lib/supabase/server";
import { intentToDiscoveryQuery } from "@/lib/discovery-params";
import {
  FUZZY_MIN_SCORE,
  companyTier,
  levenshtein,
  maxTypos,
  meaningfulTokens,
  parseIntent,
  phraseScore,
  tokenize,
  type CategoryTerm,
  type IntentChip,
} from "@/lib/search-intent";
import { categoryAndDescendantIds, findCategoryByPath } from "@/lib/services/categories";
import { getSearchCorpus, type CorpusCompany, type SearchCorpus } from "@/lib/services/search-corpus";

export type Suggestion =
  | { type: "busca"; label: string; href: string }
  | { type: "categoria"; label: string; sublabel: string; href: string }
  | { type: "empresa"; label: string; sublabel: string; href: string; logo?: string; verified: boolean }
  | { type: "atalho"; shortcut: ShortcutKey; href: string };

export type SmartSearchResponse = {
  chips: IntentChip[];
  /** destino ao apertar Enter: /empresas já com os filtros que a frase pediu */
  searchHref: string;
  suggestions: Suggestion[];
  didYouMean: string | null;
};

export type ShortcutKey = "hotels" | "realEstate" | "rooms" | "forum" | "advertise";

/** Páginas que não são "empresa": a pessoa que digita "hotel" ou "alugar sala" quer ir para elas. */
const SHORTCUTS: { key: ShortcutKey; href: string; words: string[] }[] = [
  { key: "hotels", href: "/business-travel", words: ["hotel", "hotéis", "hospedagem", "pousada", "hospedar", "business travel"] },
  { key: "realEstate", href: "/imobiliarias", words: ["imóvel", "imóveis", "imobiliária", "apartamento", "comprar casa", "alugar", "aluguel"] },
  { key: "rooms", href: "/auditorios-reunioes", words: ["auditório", "sala de reunião", "reunião", "evento", "palestra"] },
  { key: "forum", href: "/forum-de-negocios", words: ["fórum", "networking", "palestra", "evento de negócios"] },
  { key: "advertise", href: "/planos", words: ["anunciar", "divulgar", "destaque", "patrocinar", "propaganda"] },
];

const MAX_QUERY_LENGTH = 80;
const EMPTY_RESPONSE: SmartSearchResponse = { chips: [], searchHref: "/empresas", suggestions: [], didYouMean: null };

function companyMatchesFilters(company: CorpusCompany, filters: ReturnType<typeof parseIntent>["filters"], allowedCategoryIds: Set<string> | null): boolean {
  if (allowedCategoryIds && ![...company.linkIds].some((id) => allowedCategoryIds.has(id))) return false;
  if (filters.towerId && company.towerId !== filters.towerId) return false;
  if (filters.floor && company.floor !== filters.floor) return false;
  if (filters.verified && !company.verified) return false;
  if (filters.online && !company.online) return false;
  if (filters.inPerson && !company.inPerson) return false;
  return true;
}

function topCategories(tokens: string[], categories: CategoryTerm[], skipId: string | undefined): CategoryTerm[] {
  return categories
    .map((term) => ({ term, score: Math.max(0, ...term.forms.map((form) => phraseScore(tokens, form))) }))
    .filter(({ term, score }) => score >= FUZZY_MIN_SCORE && term.id !== skipId)
    .sort((a, b) => b.score - a.score || b.term.level - a.term.level || a.term.label.length - b.term.label.length)
    .slice(0, 3)
    .map(({ term }) => term);
}

/** Corrige palavras que não casaram com nada trocando pela palavra mais parecida do vocabulário. */
function suggestCorrection(tokens: string[], corpus: SearchCorpus): string | null {
  const vocabulary = new Set<string>();
  for (const category of corpus.categories) category.forms.forEach((form) => tokenize(form).forEach((word) => vocabulary.add(word)));
  for (const company of corpus.companies) tokenize(company.name).forEach((word) => vocabulary.add(word));

  let changed = false;
  const fixed = tokens.map((token) => {
    if (token.length < 4 || vocabulary.has(token)) return token;
    const limit = maxTypos(token.length) + 1;
    let best: { word: string; distance: number } | null = null;
    for (const word of vocabulary) {
      if (Math.abs(word.length - token.length) > limit) continue;
      const distance = levenshtein(token, word, limit);
      if (distance <= limit && (!best || distance < best.distance)) best = { word, distance };
    }
    if (best && best.word !== token) {
      changed = true;
      return best.word;
    }
    return token;
  });
  return changed ? fixed.join(" ") : null;
}

function shortcutSuggestions(tokens: string[]): Suggestion[] {
  return SHORTCUTS.filter(({ words }) => words.some((word) => phraseScore(tokens, word) >= 0.85)).map(
    ({ key, href }) => ({ type: "atalho" as const, shortcut: key, href }),
  );
}

/**
 * Sugestões enquanto a pessoa digita: interpreta a frase (categoria, torre, andar, filtros), lista
 * categorias, empresas e atalhos, e propõe correção se nada casou. Não registra nada: quem chama
 * decide o que logar.
 */
export async function smartSearch(rawQuery: string, locale: string): Promise<SmartSearchResponse> {
  const query = rawQuery.trim().slice(0, MAX_QUERY_LENGTH);
  const tokens = meaningfulTokens(query);
  if (tokens.length === 0) return EMPTY_RESPONSE;

  const corpus = await getSearchCorpus(locale);
  const intent = parseIntent(query, { categories: corpus.categories, towers: corpus.towers, floors: corpus.floors });
  const searchHref = `/empresas${intentToDiscoveryQuery(intent.filters, intent.rest)}`;

  const chosenPath = [intent.filters.cat, intent.filters.sub, intent.filters.spec].filter((part): part is string => Boolean(part));
  const chosenCategory = chosenPath.length ? findCategoryByPath(corpus.tree, chosenPath)?.at(-1) : undefined;
  const allowedCategoryIds = chosenCategory ? categoryAndDescendantIds(chosenCategory) : null;

  // empresas: respeitam os filtros entendidos; o texto que sobrou (nome, serviço) ordena
  const restTokens = meaningfulTokens(intent.rest);
  const matches = corpus.companies
    .filter((company) => companyMatchesFilters(company, intent.filters, allowedCategoryIds))
    .flatMap((company) => {
      if (restTokens.length === 0) return [{ company, tier: 3 }];
      const tier = companyTier(restTokens, company);
      return tier === null ? [] : [{ company, tier }];
    })
    .sort((a, b) => a.tier - b.tier || b.company.completeness - a.company.completeness || a.company.name.localeCompare(b.company.name, "pt-BR"))
    .slice(0, 5);

  const suggestions: Suggestion[] = [];
  if (intent.chips.length > 0 || intent.rest) {
    const label = [...intent.chips.map((chip) => chip.label), intent.rest && `“${intent.rest}”`].filter(Boolean).join(" · ");
    suggestions.push({ type: "busca", label, href: searchHref });
  }

  const categoryTerms = chosenCategory
    ? [corpus.categories.find((term) => term.id === chosenCategory.id), ...intent.alternatives].filter((term): term is CategoryTerm => Boolean(term))
    : topCategories(tokens, corpus.categories, undefined);
  for (const term of categoryTerms.slice(0, 3)) {
    suggestions.push({ type: "categoria", label: term.label.split(" › ").at(-1) ?? term.label, sublabel: term.label, href: `/categoria/${term.path}` });
  }

  for (const { company } of matches) {
    suggestions.push({
      type: "empresa",
      label: company.name,
      sublabel: [company.categoryLabel, company.towerName].filter(Boolean).join(" · "),
      href: `/empresa/${company.slug}`,
      logo: company.logo,
      verified: company.verified,
    });
  }

  suggestions.push(...shortcutSuggestions(tokens));

  const hasRealResults = suggestions.some((suggestion) => suggestion.type !== "busca");
  return {
    chips: intent.chips,
    searchHref,
    suggestions,
    didYouMean: hasRealResults ? null : suggestCorrection(tokens, corpus),
  };
}

export type PopularSearches = { terms: string[]; categories: { label: string; href: string }[] };

const POPULAR_TTL_MS = 10 * 60_000;
const popularCache = new Map<string, { expiresAt: number; value: Promise<PopularSearches> }>();

async function loadPopular(locale: string): Promise<PopularSearches> {
  const corpus = await getSearchCorpus(locale);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await createServiceClient()
    .from("metrics_events")
    .select("metadata")
    .eq("event_type", "search_performed")
    .gte("created_at", since)
    .limit(5000);
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const term = (row.metadata as { term?: string } | null)?.term?.trim().toLowerCase();
    if (term && term.length >= 3 && term.length <= 40) counts.set(term, (counts.get(term) ?? 0) + 1);
  }
  // só termos que realmente levam a alguma coisa (nada de lixo ou busca sem resposta)
  const usable = [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([term]) => term)
    .filter((term) => {
      const intent = parseIntent(term, { categories: corpus.categories, towers: corpus.towers, floors: corpus.floors });
      const tokens = meaningfulTokens(term);
      return intent.chips.length > 0 || corpus.companies.some((company) => companyTier(tokens, company) !== null);
    })
    .slice(0, 6);

  // categorias com mais empresas: sempre há o que mostrar, mesmo sem histórico de buscas
  const categoriesByCompanies = corpus.categories
    .filter((term) => term.level <= 2)
    .map((term) => {
      const category = findCategoryByPath(corpus.tree, term.path.split("/"))?.at(-1);
      const ids = category ? categoryAndDescendantIds(category) : new Set<string>();
      return { term, count: corpus.companies.filter((company) => [...company.linkIds].some((id) => ids.has(id))).length };
    })
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map(({ term }) => ({ label: term.label.split(" › ").at(-1) ?? term.label, href: `/categoria/${term.path}` }));

  return { terms: usable, categories: categoriesByCompanies };
}

/** Buscas em alta (últimos 30 dias) e categorias com mais empresas, em cache de 10 min. */
export function getPopularSearches(locale: string): Promise<PopularSearches> {
  const hit = popularCache.get(locale);
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  const value = loadPopular(locale);
  popularCache.set(locale, { expiresAt: Date.now() + POPULAR_TTL_MS, value });
  value.catch(() => popularCache.delete(locale));
  return value;
}
