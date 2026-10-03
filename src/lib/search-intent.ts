/**
 * Motor da pesquisa inteligente: normalização, tolerância a erro de digitação, sinônimos (palavras-chave
 * das categorias) e interpretação de frases ("dentista implante torre park" → categoria + torre).
 * Funções puras, sem banco nem framework, para serem testadas e usadas no servidor e na busca da página.
 */

const STOPWORDS = new Set([
  "a", "o", "as", "os", "e", "de", "da", "do", "das", "dos", "em", "na", "no", "nas", "nos", "para", "pra", "por",
  "com", "um", "uma", "perto", "procuro", "preciso", "quero", "buscar", "busco", "empresa", "empresas",
  "servico", "servicos", "melhor", "melhores", "torre", "andar",
]);

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function tokenize(value: string): string[] {
  const normalized = normalizeText(value);
  return normalized ? normalized.split(" ") : [];
}

/** Tokens úteis da busca (sem palavras de ligação como "de", "para", "empresa"). */
export function meaningfulTokens(value: string): string[] {
  return tokenize(value).filter((token) => !STOPWORDS.has(token));
}

/** Erros de digitação aceitos conforme o tamanho da palavra: curtas exigem exatidão. */
/** Nota mínima para aceitar um casamento com erro de digitação (0.6 menos a penalidade de textos longos). */
export const FUZZY_MIN_SCORE = 0.55;

export function maxTypos(length: number): number {
  if (length <= 4) return 0;
  return length <= 7 ? 1 : 2;
}

/** Distância de edição com corte: devolve `limit + 1` assim que passa do limite. */
export function levenshtein(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      rowMin = Math.min(rowMin, current[j]);
    }
    if (rowMin > limit) return limit + 1;
    previous = current;
  }
  return previous[b.length];
}

/** Quão bem uma palavra digitada casa com uma palavra do texto: 1 exata, 0.85 prefixo, 0.6 com erro de digitação, 0 nada. */
export function wordScore(queryWord: string, textWord: string): number {
  if (queryWord === textWord) return 1;
  // plural/singular simples ("dentista" × "dentistas"): vale mais que prefixo
  if (queryWord.length >= 4 && (queryWord + "s" === textWord || textWord + "s" === queryWord)) return 0.95;
  if (queryWord.length >= 3 && textWord.startsWith(queryWord)) return 0.85;
  const typos = Math.min(maxTypos(queryWord.length), maxTypos(textWord.length));
  if (typos > 0 && levenshtein(queryWord, textWord, typos) <= typos) return 0.6;
  return 0;
}

/**
 * Nota de uma frase de texto para as palavras da busca: todas as palavras precisam casar com alguma
 * palavra do texto (média das notas). Devolve 0 se qualquer uma ficar sem par. Pequena penalidade
 * para textos longos, para preferir o nome mais próximo ("Estética" antes de "Medicina estética").
 */
export function phraseScore(queryTokens: string[], text: string): number {
  if (queryTokens.length === 0) return 0;
  const words = tokenize(text);
  if (words.length === 0) return 0;
  let total = 0;
  for (const token of queryTokens) {
    const best = Math.max(...words.map((word) => wordScore(token, word)));
    if (best === 0) return 0;
    total += best;
  }
  return total / queryTokens.length - 0.01 * (words.length - 1);
}

// ---- interpretação da frase -------------------------------------------------------------------

export type CategoryTerm = {
  id: string;
  level: 1 | 2 | 3;
  /** `saude-e-estetica/dentistas` */
  path: string;
  label: string;
  /** nome + palavras-chave (sinônimos) */
  forms: string[];
};

export type TowerTerm = { id: string; name: string };

export type IntentFilters = {
  cat?: string;
  sub?: string;
  spec?: string;
  towerId?: string;
  floor?: string;
  verified?: boolean;
  online?: boolean;
  inPerson?: boolean;
};

export type IntentChip = { kind: "categoria" | "torre" | "andar" | "filtro"; label: string };

export type Intent = {
  filters: IntentFilters;
  /** o que sobrou da frase (nome de empresa, serviço...) para a busca por texto */
  rest: string;
  chips: IntentChip[];
  /** outras categorias que também casaram, para sugerir quando a frase é ambígua */
  alternatives: CategoryTerm[];
};

const FLAG_WORDS: Record<string, keyof IntentFilters> = {
  verificada: "verified",
  verificado: "verified",
  verificadas: "verified",
  online: "online",
  presencial: "inPerson",
};

function bestCategoryScore(tokens: string[], term: CategoryTerm): number {
  return Math.max(0, ...term.forms.map((form) => phraseScore(tokens, form)));
}

/** Janelas de 1 a 3 palavras seguidas ("harmonizacao facial", "contador mei"). */
function windows(tokens: string[]): { tokens: string[]; indexes: number[] }[] {
  const result: { tokens: string[]; indexes: number[] }[] = [];
  for (let size = Math.min(3, tokens.length); size >= 1; size -= 1) {
    for (let start = 0; start + size <= tokens.length; start += 1) {
      const indexes = Array.from({ length: size }, (_, offset) => start + offset);
      result.push({ tokens: indexes.map((index) => tokens[index]), indexes });
    }
  }
  return result;
}

function pathParts(path: string): { cat?: string; sub?: string; spec?: string } {
  const [cat, sub, spec] = path.split("/");
  return { cat, sub, spec };
}

export function parseIntent(
  query: string,
  context: { categories: CategoryTerm[]; towers: TowerTerm[]; floors: string[] },
): Intent {
  const filters: IntentFilters = {};
  const chips: IntentChip[] = [];
  let normalized = normalizeText(query);

  // andar: "5 andar", "5o andar", "andar 5"
  const floorMatch = normalized.match(/\b(\d{1,2})\s*(?:o|a)?\s*andar\b|\bandar\s*(\d{1,2})\b/);
  const floorValue = floorMatch?.[1] ?? floorMatch?.[2];
  if (floorMatch && floorValue && context.floors.includes(String(Number(floorValue)))) {
    filters.floor = String(Number(floorValue));
    chips.push({ kind: "andar", label: `${filters.floor}º andar` });
    normalized = normalized.replace(floorMatch[0], " ");
  }

  let tokens = tokenize(normalized);

  // filtros por palavra solta
  tokens = tokens.filter((token) => {
    const flag = FLAG_WORDS[token];
    if (!flag) return true;
    (filters as Record<string, boolean>)[flag] = true;
    chips.push({ kind: "filtro", label: token.startsWith("verific") ? "Verificada" : token === "online" ? "Atendimento online" : "Atendimento presencial" });
    return false;
  });

  // torre pelo nome ("park", "union"...)
  for (const tower of context.towers) {
    const towerWords = tokenize(tower.name).filter((word) => word !== "torre");
    const hit = towerWords.length > 0 && towerWords.every((word) => tokens.some((token) => token === word));
    if (hit) {
      filters.towerId = tower.id;
      chips.push({ kind: "torre", label: tower.name });
      tokens = tokens.filter((token) => !towerWords.includes(token));
      break;
    }
  }

  // categoria: melhor casamento, depois aprofunda para uma descendente que também casou
  const meaningful = tokens.filter((token) => !STOPWORDS.has(token));
  const matches: { term: CategoryTerm; score: number; indexes: number[] }[] = [];
  for (const window of windows(meaningful)) {
    for (const term of context.categories) {
      const score = bestCategoryScore(window.tokens, term);
      if (score >= FUZZY_MIN_SCORE) matches.push({ term, score, indexes: window.indexes });
    }
  }
  // casar mais palavras da frase ("advogado trabalhista") vale mais que casar uma só; depois, a categoria mais específica
  const rank = (match: { score: number; indexes: number[] }) => match.score + 0.05 * (match.indexes.length - 1);
  matches.sort((a, b) => rank(b) - rank(a) || b.term.level - a.term.level);

  let chosen = matches[0];
  const consumed = new Set<number>();
  if (chosen) {
    for (;;) {
      const deeper = matches.find(
        (match) =>
          match.term.level > chosen.term.level &&
          match.term.path.startsWith(`${chosen.term.path}/`) &&
          match.score >= 0.85 &&
          !match.indexes.some((index) => chosen.indexes.includes(index)),
      );
      if (!deeper) break;
      chosen.indexes.forEach((index) => consumed.add(index));
      chosen = deeper;
    }
    chosen.indexes.forEach((index) => consumed.add(index));
    Object.assign(filters, pathParts(chosen.term.path));
    chips.push({ kind: "categoria", label: chosen.term.label });
  }

  const alternatives: CategoryTerm[] = [];
  for (const match of matches) {
    if (match.term.id === chosen?.term.id || alternatives.some((term) => term.id === match.term.id)) continue;
    if (match.score >= 0.85) alternatives.push(match.term);
    if (alternatives.length >= 3) break;
  }

  const rest = meaningful.filter((_, index) => !consumed.has(index)).join(" ");
  return { filters, rest, chips, alternatives };
}

// ---- pontuação de empresas --------------------------------------------------------------------

export type SearchableCompany = {
  name: string;
  description: string;
  tags: string[];
  /** nomes + palavras-chave das categorias a que a empresa pertence */
  categoryForms: string[];
};

/**
 * Faixa de relevância textual (menor é melhor): 0 nome exato, 1 nome começa com, 2 nome contém,
 * 3 categoria/sinônimo, 4 tag, 5 descrição, 6 nome com erro de digitação. null = não casou.
 */
export function companyTier(queryTokens: string[], company: SearchableCompany): number | null {
  if (queryTokens.length === 0) return null;
  const phrase = queryTokens.join(" ");
  const name = normalizeText(company.name);
  if (name === phrase) return 0;
  if (name.startsWith(phrase)) return 1;
  if (name.includes(phrase)) return 2;
  if (company.categoryForms.some((form) => phraseScore(queryTokens, form) >= 0.85)) return 3;
  if (company.tags.some((tag) => phraseScore(queryTokens, tag) >= 0.85)) return 4;
  const description = normalizeText(company.description);
  if (queryTokens.every((token) => description.includes(token))) return 5;
  if (phraseScore(queryTokens, company.name) >= FUZZY_MIN_SCORE) return 6;
  return null;
}
