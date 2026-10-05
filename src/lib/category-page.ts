import type { Category } from "./services/categories.ts";

/** Destino de um anúncio: só caminho interno ("/...") ou http(s); qualquer outra coisa (javascript:, data:) cai no padrão. */
export function safeHref(url: string | null | undefined, fallback: string): { href: string; external: boolean } {
  const value = url?.trim();
  if (value && /^https?:\/\//i.test(value)) return { href: value, external: true };
  if (value && value.startsWith("/") && !value.startsWith("//")) return { href: value, external: false };
  return { href: fallback, external: false };
}

/** Quantos filtros avançados estão ligados (a busca por texto e a ordenação não contam). */
export function countActiveFilters(filters: {
  towerId?: string;
  floor?: string;
  verified: boolean;
  inPerson: boolean;
  online: boolean;
}): number {
  return [filters.towerId, filters.floor, filters.verified, filters.inPerson, filters.online].filter(Boolean).length;
}

/**
 * Pílulas de subcategoria: se a categoria atual tem filhas, mostra as filhas ("Todas" = a atual);
 * senão mostra as irmãs ("Todas" = a mãe) com a atual marcada.
 */
export function pillContext(trail: Category[]): { parent: Category; items: Category[]; activeId: string | null } {
  const current = trail[trail.length - 1];
  if (current.children.length > 0 || trail.length === 1) {
    return { parent: current, items: current.children, activeId: null };
  }
  const parent = trail[trail.length - 2];
  return { parent, items: parent.children, activeId: current.id };
}

/** URL aceita em campo de anúncio/conteúdo: caminho interno ("/...") ou http(s). Vazio é válido (campo opcional). */
export function isAllowedUrl(url: string): boolean {
  const value = url.trim();
  return value === "" || safeHref(value, "").href === value;
}
