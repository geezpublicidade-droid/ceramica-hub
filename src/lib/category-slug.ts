const COMBINING_MARKS_RE = new RegExp("[\u0300-\u036f]", "g");

/** Slug de uma categoria legada (texto de `businesses.category`), o mesmo usado nas URLs de /categoria. */
export function slugFromCategory(category: string): string {
  return category
    .normalize("NFD")
    .replace(COMBINING_MARKS_RE, "")
    .toLowerCase()
    .replace(/&/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
