import { createServiceClient } from "@/lib/supabase/server";
import type { Business } from "@/data/businesses";
import { getAllBusinesses } from "@/lib/services/platform";
import type { DiscoverySort } from "@/lib/discovery-params";
import { companyTier, meaningfulTokens, tokenize } from "@/lib/search-intent";
import { getFeaturesForBusinesses } from "@/lib/services/company-plan";
import { rankCompanies, rankingTier, type RankingContext } from "@/lib/plans/ranking";
import {
  categoryAndDescendantIds,
  getBusinessCategoryLinks,
  getCategoryTree,
  type Category,
  type CategoryTree,
} from "@/lib/services/categories";


export type DiscoveryFilters = {
  q: string;
  /** slug da macrocategoria */
  cat?: string;
  /** slug da subcategoria (dentro de `cat`) */
  sub?: string;
  /** slug da especialidade (dentro de `sub`) */
  spec?: string;
  towerId?: string;
  floor?: string;
  verified: boolean;
  inPerson: boolean;
  online: boolean;
  sort: DiscoverySort;
  page: number;
  /** empresas já exibidas em blocos patrocinados: não repetir na listagem orgânica */
  excludeIds?: ReadonlySet<string>;
};

export type DiscoveryItem = {
  business: Business;
  /** nome da categoria mais específica a que a empresa pertence, para o card */
  categoryLabel: string;
  /** posição (1 = primeiro) em toda a lista, não só na página: base das métricas de impressão */
  position: number;
  rating: { average: number; count: number } | null;
};

export type DiscoveryResult = {
  items: DiscoveryItem[];
  total: number;
  pageSize: number;
  tree: CategoryTree;
  /** categoria selecionada em cada nível, para breadcrumb e chips */
  selected: { macro: Category | null; sub: Category | null; spec: Category | null };
  towers: { id: string; name: string }[];
  floors: string[];
  /** contagem de empresas aprovadas por macrocategoria (sem filtros) */
  macroCounts: Map<string, number>;
};

export const DISCOVERY_PAGE_SIZE = 12;

export type Facet = {
  id: string;
  tower_id: string;
  floor: string;
  serves_in_person: boolean;
  serves_online: boolean;
  created_at: string;
  tags: string[] | null;
};

/** Completude do perfil: sinal orgânico de relevância (plano pago NÃO entra aqui). */
export function profileCompleteness(business: Business): number {
  return (
    (business.logo ? 2 : 0) +
    (business.coverPhoto ? 2 : 0) +
    (business.description.length > 60 ? 2 : 0) +
    (business.openingHours ? 1 : 0) +
    (business.websiteUrl ? 1 : 0) +
    (business.instagram ? 1 : 0) +
    (business.verified ? 3 : 0)
  );
}

/** Dados por empresa aprovada que o `Business` não carrega (torre, andar, atendimento, tags) + torres ativas. */
export async function loadFacets(): Promise<{ facets: Map<string, Facet>; towers: { id: string; name: string }[] }> {
  const supabase = createServiceClient();
  const [facetRows, towerRows] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, tower_id, floor, serves_in_person, serves_online, created_at, tags")
      .eq("status", "approved"),
    supabase.from("towers").select("id, name").eq("active", true).order("sort_order"),
  ]);
  if (facetRows.error) throw facetRows.error;
  if (towerRows.error) throw towerRows.error;
  return {
    facets: new Map(((facetRows.data ?? []) as Facet[]).map((row) => [row.id, row])),
    towers: (towerRows.data ?? []) as { id: string; name: string }[],
  };
}

/** Visitas dos últimos 90 dias por empresa. Pesado: só chamar quando a ordenação é por acessos. */
async function loadViewCounts(): Promise<Map<string, number>> {
  const supabase = createServiceClient();
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("metrics_events")
    .select("business_id")
    .eq("event_type", "commercial_page_viewed")
    .gte("created_at", since)
    .limit(50000);
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.business_id) continue;
    counts.set(row.business_id as string, (counts.get(row.business_id as string) ?? 0) + 1);
  }
  return counts;
}

/** Só avaliações aprovadas (reais); empresa sem avaliação fica fora do ranking por nota. `businessIds` limita a consulta (cards da página). */
async function loadRatings(businessIds?: string[]): Promise<Map<string, { average: number; count: number }>> {
  if (businessIds && businessIds.length === 0) return new Map();
  const supabase = createServiceClient();
  let query = supabase.from("business_reviews").select("business_id, rating").eq("status", "aprovado");
  if (businessIds) query = query.in("business_id", businessIds);
  const { data, error } = await query;
  if (error) throw error;
  const sums = new Map<string, { total: number; count: number }>();
  for (const row of data ?? []) {
    const entry = sums.get(row.business_id as string) ?? { total: 0, count: 0 };
    entry.total += row.rating as number;
    entry.count += 1;
    sums.set(row.business_id as string, entry);
  }
  return new Map([...sums].map(([id, { total, count }]) => [id, { average: total / count, count }]));
}

function mostSpecificCategory(tree: CategoryTree, ids: Set<string> | undefined): Category | null {
  let best: Category | null = null;
  for (const id of ids ?? []) {
    const category = tree.byId.get(id);
    if (category && (!best || category.level > best.level)) best = category;
  }
  return best;
}

function compareBy(
  sort: DiscoverySort,
  views: Map<string, number>,
  ratings: Map<string, { average: number; count: number }>,
  facets: Map<string, Facet>,
) {
  return (a: Business, b: Business): number => {
    switch (sort) {
      case "views":
        return (views.get(b.id) ?? 0) - (views.get(a.id) ?? 0);
      case "rating":
        return (ratings.get(b.id)?.average ?? -1) - (ratings.get(a.id)?.average ?? -1);
      case "recent":
        return (facets.get(b.id)?.created_at ?? "").localeCompare(facets.get(a.id)?.created_at ?? "");
      case "alpha":
        return a.name.localeCompare(b.name, "pt-BR");
      default:
        return profileCompleteness(b) - profileCompleteness(a);
    }
  };
}

/**
 * Descoberta de empresas aprovadas com filtros, busca e ordenação.
 * Resolve tudo em memória sobre as empresas aprovadas (volume pequeno hoje);
 * se o diretório passar de poucas centenas, mover filtro/ordenação para SQL.
 */
export async function discoverCompanies(
  filters: DiscoveryFilters,
  locale: string,
  preloaded: { businesses?: Business[]; tree?: CategoryTree } = {},
): Promise<DiscoveryResult> {
  // visitas e notas só entram na consulta quando a ordenação escolhida precisa delas
  const [businesses, tree, links, { facets, towers }, views, sortRatings] = await Promise.all([
    preloaded.businesses ?? getAllBusinesses(locale),
    preloaded.tree ?? getCategoryTree(locale),
    getBusinessCategoryLinks(),
    loadFacets(),
    filters.sort === "views" ? loadViewCounts() : Promise.resolve(new Map<string, number>()),
    filters.sort === "rating" ? loadRatings() : Promise.resolve(new Map<string, { average: number; count: number }>()),
  ]);

  const macro = tree.roots.find((root) => root.slug === filters.cat) ?? null;
  const sub = macro?.children.find((child) => child.slug === filters.sub) ?? null;
  const spec = sub?.children.find((child) => child.slug === filters.spec) ?? null;
  const activeCategory = spec ?? sub ?? macro;
  const allowedCategoryIds = activeCategory ? categoryAndDescendantIds(activeCategory) : null;

  const macroCounts = new Map<string, number>();
  for (const root of tree.roots) {
    const ids = categoryAndDescendantIds(root);
    macroCounts.set(
      root.id,
      businesses.filter((business) => [...(links.get(business.id) ?? [])].some((id) => ids.has(id))).length,
    );
  }

  // palavras úteis da busca; se só sobraram palavras de ligação ("de", "para"), usa a frase inteira
  const queryTokens = meaningfulTokens(filters.q).length > 0 ? meaningfulTokens(filters.q) : tokenize(filters.q);
  const term = queryTokens.length > 0;
  const scored: { business: Business; tier: number }[] = [];

  for (const business of businesses) {
    if (filters.excludeIds?.has(business.id)) continue;
    const facet = facets.get(business.id);
    const businessLinks = links.get(business.id);
    if (allowedCategoryIds && ![...(businessLinks ?? [])].some((id) => allowedCategoryIds.has(id))) continue;
    if (filters.towerId && facet?.tower_id !== filters.towerId) continue;
    if (filters.floor && facet?.floor !== filters.floor) continue;
    if (filters.verified && !business.verified) continue;
    if (filters.inPerson && !facet?.serves_in_person) continue;
    if (filters.online && !facet?.serves_online) continue;

    let tier = 0;
    if (term) {
      // nome + sinônimos das categorias da empresa: "odontologia" acha quem está em Dentistas
      const categoryForms = [...(businessLinks ?? [])].flatMap((id) => {
        const category = tree.byId.get(id);
        return category ? [category.name, ...category.keywords] : [];
      });
      const matched = companyTier(queryTokens, {
        name: business.name,
        description: business.description,
        tags: facet?.tags ?? [],
        categoryForms,
      });
      if (matched === null) continue;
      tier = matched;
    }
    scored.push({ business, tier });
  }

  let ordered = scored;
  if (filters.sort === "relevance") {
    // Padrão: relevância textual > nível do plano (Premium > ... > Gratuito) > rodízio equilibrado dentro do mesmo nível
    const context: RankingContext = term ? "search" : activeCategory ? "category" : "directory";
    const features = await getFeaturesForBusinesses(scored.map(({ business }) => business));
    const byId = new Map(scored.map((entry) => [entry.business.id, entry]));
    const ranked = rankCompanies(
      scored.map(({ business, tier }) => ({ id: business.id, relevance: term ? tier : 0, tier: features.has(business.id) ? rankingTier(features.get(business.id)!, context) : 0 })),
      { context: `${context}|${activeCategory?.slug ?? "todas"}|${queryTokens.join(" ")}` },
    );
    ordered = ranked.map((entry) => byId.get(entry.id)!);
  } else {
    // Ordenação escolhida pelo usuário (acessos, nota, recentes, A–Z): sem prioridade de plano
    const byChosenSort = compareBy(filters.sort, views, sortRatings, facets);
    const byRelevance = compareBy("relevance", views, sortRatings, facets);
    scored.sort((a, b) => byChosenSort(a.business, b.business) || byRelevance(a.business, b.business) || a.business.name.localeCompare(b.business.name, "pt-BR"));
  }

  const start = (filters.page - 1) * DISCOVERY_PAGE_SIZE;
  const pageBusinesses = ordered.slice(start, start + DISCOVERY_PAGE_SIZE);
  // na ordenação por nota o mapa completo já está carregado; senão busca só as notas dos cards da página
  const ratings =
    filters.sort === "rating" ? sortRatings : await loadRatings(pageBusinesses.map(({ business }) => business.id));
  const items: DiscoveryItem[] = pageBusinesses.map(({ business }, index) => ({
    business,
    position: start + index + 1,
    categoryLabel: mostSpecificCategory(tree, links.get(business.id))?.name ?? business.category,
    rating: ratings.get(business.id) ?? null,
  }));

  return {
    items,
    total: scored.length,
    pageSize: DISCOVERY_PAGE_SIZE,
    tree,
    selected: { macro, sub, spec },
    towers,
    floors: [...new Set([...facets.values()].map((facet) => facet.floor))].sort((a, b) =>
      a.localeCompare(b, "pt-BR", { numeric: true }),
    ),
    macroCounts,
  };
}
