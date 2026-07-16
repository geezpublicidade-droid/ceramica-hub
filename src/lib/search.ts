import type { Business } from "@/data/businesses";

export function matchBusinesses(term: string, businesses: Business[]): Business[] {
  const normalized = term.trim().toLowerCase();
  if (!normalized) return businesses;

  return businesses.filter((business) =>
    [business.name, business.category, business.description, business.floor]
      .join(" ")
      .toLowerCase()
      .includes(normalized)
  );
}
