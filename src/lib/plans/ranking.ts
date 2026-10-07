import type { FeatureMap } from "./features.ts";
import { canAccess, getLimit } from "./resolve.ts";

/** Janela do rodízio: a cada hora a ordem dentro do mesmo nível gira uma posição. */
export const ROTATION_WINDOW_MS = 60 * 60 * 1000;

export type RankingContext = "search" | "category" | "directory" | "home";

/**
 * Nível de posicionamento da empresa (maior aparece antes): `priority_level` do plano, mais um bônus para patrocinador
 * em campanha. Se o plano (ou o admin, por override) desligou a prioridade do contexto, a empresa fica no máximo no nível 1
 * (acima das gratuitas, abaixo dos planos com prioridade). Contexto "home" usa "Empresas em Destaque".
 */
export function rankingTier(features: Readonly<FeatureMap>, context: RankingContext): number {
  let level = getLimit(features, "priority_level");
  if (!Number.isFinite(level)) level = 5;
  const allowed =
    context === "search" ? canAccess(features, "search_priority") : context === "category" ? canAccess(features, "category_priority") : context === "home" ? canAccess(features, "featured_home_priority") || level <= 1 : true;
  if (!allowed) level = Math.min(level, 1);
  return level + (canAccess(features, "sponsor_top_priority") ? 10 : 0);
}

/** Hash simples e estável (FNV-1a 32 bits) para deslocar o rodízio por contexto sem sorteio. */
export function stableHash(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export type RotationOptions = { context: string; now?: Date; windowMs?: number };

/**
 * Rodízio equilibrado: dentro de cada grupo de empresas EQUIVALENTES (mesmo nível), a lista gira uma posição por janela de tempo.
 * Ordem base estável (por id) + deslocamento = janela + hash do contexto, então cada empresa passa pela primeira posição
 * exatamente uma vez a cada N janelas, sem sorteio e sem favorecer ninguém. Determinístico: a mesma hora dá a mesma ordem.
 */
export function rotateWithin<T>(items: readonly T[], idOf: (item: T) => string, options: RotationOptions): T[] {
  if (items.length < 2) return [...items];
  const window = Math.floor((options.now ?? new Date()).getTime() / (options.windowMs ?? ROTATION_WINDOW_MS));
  const base = [...items].sort((a, b) => idOf(a).localeCompare(idOf(b)));
  const offset = (window + stableHash(options.context)) % base.length;
  return [...base.slice(offset), ...base.slice(0, offset)];
}

export type Rankable = { id: string; tier: number; /** posição de relevância (menor = mais relevante), p.ex. faixa textual da busca */ relevance?: number };

/**
 * Ordena por relevância (se houver), depois por nível de plano (maior primeiro) e aplica o rodízio dentro de cada grupo de
 * mesmo (relevância, nível). `secondary` desempata o que sobrou (ex.: completude do perfil) ANTES do rodízio entra em cada grupo
 * apenas quando `rotate` é true; com ordenação escolhida pelo usuário (nota, acessos, A–Z) não há rodízio nem prioridade de plano.
 */
export function rankCompanies<T extends Rankable>(items: readonly T[], options: RotationOptions): T[] {
  const sorted = [...items].sort((a, b) => (a.relevance ?? 0) - (b.relevance ?? 0) || b.tier - a.tier || a.id.localeCompare(b.id));
  const result: T[] = [];
  let index = 0;
  while (index < sorted.length) {
    let end = index + 1;
    while (end < sorted.length && sorted[end].tier === sorted[index].tier && (sorted[end].relevance ?? 0) === (sorted[index].relevance ?? 0)) end += 1;
    result.push(...rotateWithin(sorted.slice(index, end), (item) => item.id, { ...options, context: `${options.context}|${sorted[index].tier}|${sorted[index].relevance ?? 0}` }));
    index = end;
  }
  return result;
}

export type ListingBadge = "premium" | "featured" | "sponsored" | null;

/** Selo discreto do cartão: o mais alto que o plano libera (Premium > Em destaque > Patrocinada). */
export function listingBadge(features: Readonly<FeatureMap>): ListingBadge {
  if (canAccess(features, "premium_badge")) return "premium";
  if (canAccess(features, "featured_badge")) return "featured";
  if (canAccess(features, "sponsored_badge")) return "sponsored";
  return null;
}
