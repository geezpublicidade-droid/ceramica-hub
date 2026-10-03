import type { DiscoveryFilters } from "@/lib/services/company-discovery";

export const DISCOVERY_SORTS = ["relevance", "views", "rating", "alpha", "recent"] as const;
export type DiscoverySort = (typeof DISCOVERY_SORTS)[number];

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  const single = Array.isArray(value) ? value[0] : value;
  const trimmed = single?.trim();
  return trimmed ? trimmed : undefined;
}

/** Converte a query string da URL em filtros; valores inválidos viram o padrão. */
export function parseDiscoveryParams(raw: RawSearchParams): { filters: DiscoveryFilters; view: "grid" | "list" } {
  const sort = first(raw.sort) as DiscoverySort | undefined;
  const page = Number.parseInt(first(raw.page) ?? "1", 10);
  return {
    filters: {
      q: (first(raw.q) ?? "").slice(0, 100),
      cat: first(raw.cat),
      sub: first(raw.sub),
      spec: first(raw.spec),
      towerId: first(raw.tower),
      floor: first(raw.floor),
      verified: first(raw.verified) === "1",
      inPerson: first(raw.presencial) === "1",
      online: first(raw.online) === "1",
      sort: sort && DISCOVERY_SORTS.includes(sort) ? sort : "relevance",
      page: Number.isFinite(page) && page > 0 ? page : 1,
    },
    view: first(raw.view) === "list" ? "list" : "grid",
  };
}

/** Monta `?a=1&b=2` só com o que tem valor; `overrides` com undefined remove o parâmetro. */
export function buildDiscoveryQuery(
  filters: DiscoveryFilters,
  view: "grid" | "list",
  overrides: Partial<Record<"q" | "cat" | "sub" | "spec" | "tower" | "floor" | "verified" | "presencial" | "online" | "sort" | "page" | "view", string | undefined>> = {},
): string {
  const base: Record<string, string | undefined> = {
    q: filters.q || undefined,
    cat: filters.cat,
    sub: filters.sub,
    spec: filters.spec,
    tower: filters.towerId,
    floor: filters.floor,
    verified: filters.verified ? "1" : undefined,
    presencial: filters.inPerson ? "1" : undefined,
    online: filters.online ? "1" : undefined,
    sort: filters.sort === "relevance" ? undefined : filters.sort,
    page: filters.page > 1 ? String(filters.page) : undefined,
    view: view === "list" ? "list" : undefined,
  };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...base, ...overrides })) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** Prefixo de idioma para `<form action>` nativo (next-intl usa "as-needed": português sem prefixo). */
export function localizedPath(locale: string, path: string): string {
  return locale === "pt" ? path : `/${locale}${path}`;
}
