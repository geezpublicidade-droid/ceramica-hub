import { categories } from "@/data/businesses";

const COMBINING_MARKS_RE = new RegExp("[\\u0300-\\u036f]", "g");

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(COMBINING_MARKS_RE, "")
    .toLowerCase()
    .replace(/&/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const realCategories = categories.filter((category) => category !== "Todas");

export const categorySlugs: readonly string[] = realCategories.map(slugify);

const slugToCategory = new Map(realCategories.map((category) => [slugify(category), category]));

export function categoryFromSlug(slug: string): string | null {
  return slugToCategory.get(slug) ?? null;
}

export function slugFromCategory(category: string): string {
  return slugify(category);
}
