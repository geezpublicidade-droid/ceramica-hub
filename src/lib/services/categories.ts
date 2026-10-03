import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/server";

export type Category = {
  id: string;
  parentId: string | null;
  level: 1 | 2 | 3;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  children: Category[];
};

type CategoryRow = {
  id: string;
  parent_id: string | null;
  level: 1 | 2 | 3;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  translations: Record<string, { name?: string; description?: string }> | null;
};

export type CategoryTree = {
  /** macrocategorias (nível 1), cada uma com subcategorias e especialidades aninhadas */
  roots: Category[];
  byId: Map<string, Category>;
};

/** Árvore de categorias ativas, com nome/descrição no idioma pedido (fallback: português). Memoizada por requisição (metadata e página compartilham a consulta). */
export const getCategoryTree = cache(async (locale?: string): Promise<CategoryTree> => {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, parent_id, level, slug, name, description, icon, sort_order, translations")
    .eq("active", true)
    .order("sort_order");
  if (error) throw error;

  const byId = new Map<string, Category>();
  for (const row of (data ?? []) as CategoryRow[]) {
    const translated = locale ? row.translations?.[locale] : undefined;
    byId.set(row.id, {
      id: row.id,
      parentId: row.parent_id,
      level: row.level,
      slug: row.slug,
      name: translated?.name ?? row.name,
      description: translated?.description ?? row.description,
      icon: row.icon,
      sortOrder: row.sort_order,
      children: [],
    });
  }

  const roots: Category[] = [];
  for (const category of byId.values()) {
    const parent = category.parentId ? byId.get(category.parentId) : undefined;
    if (parent) parent.children.push(category);
    else if (category.level === 1) roots.push(category);
  }
  return { roots, byId };
});

/** Resolve `/categoria/a/b/c` descendo a árvore pelos slugs; null se algum não existir. */
export function findCategoryByPath(tree: CategoryTree, slugs: string[]): Category[] | null {
  const trail: Category[] = [];
  let level: Category[] = tree.roots;
  for (const slug of slugs) {
    const match = level.find((category) => category.slug === slug);
    if (!match) return null;
    trail.push(match);
    level = match.children;
  }
  return trail;
}

/** Ids da categoria e de todas as descendentes (filtrar por macro inclui sub e especialidades). */
export function categoryAndDescendantIds(category: Category): Set<string> {
  const ids = new Set<string>([category.id]);
  for (const child of category.children) {
    for (const id of categoryAndDescendantIds(child)) ids.add(id);
  }
  return ids;
}

/** Vínculos empresa → categorias (qualquer nível). Memoizada por requisição. */
export const getBusinessCategoryLinks = cache(async (): Promise<Map<string, Set<string>>> => {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("business_categories").select("business_id, category_id");
  if (error) throw error;

  const links = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    const set = links.get(row.business_id as string) ?? new Set<string>();
    set.add(row.category_id as string);
    links.set(row.business_id as string, set);
  }
  return links;
});

/** Há ao menos uma empresa aprovada na categoria (ou em alguma descendente)? Consulta de 1 linha, para o metadata. */
export async function hasApprovedBusinesses(category: Category): Promise<boolean> {
  const { data, error } = await createServiceClient()
    .from("business_categories")
    .select("business_id, businesses!inner(status)")
    .in("category_id", [...categoryAndDescendantIds(category)])
    .eq("businesses.status", "approved")
    .limit(1);
  if (error) throw error;
  return (data ?? []).length > 0;
}

/**
 * Ids das categorias que têm empresa aprovada, contando as ancestrais (quem tem empresa em
 * Dentistas também tem em Saúde). Uma passada pelos vínculos, sem laço por categoria.
 */
export function categoriesWithCompanies(
  tree: CategoryTree,
  approvedBusinessIds: ReadonlySet<string>,
  links: Map<string, Set<string>>,
): Set<string> {
  const withCompanies = new Set<string>();
  for (const [businessId, categoryIds] of links) {
    if (!approvedBusinessIds.has(businessId)) continue;
    for (const categoryId of categoryIds) {
      for (let node = tree.byId.get(categoryId); node && !withCompanies.has(node.id); node = node.parentId ? tree.byId.get(node.parentId) : undefined) {
        withCompanies.add(node.id);
      }
    }
  }
  return withCompanies;
}

/** Caminho slug da categoria (`saude-e-estetica/dentistas`) para montar links. */
export function categoryPath(tree: CategoryTree, category: Category): string {
  const slugs: string[] = [];
  let current: Category | undefined = category;
  while (current) {
    slugs.unshift(current.slug);
    current = current.parentId ? tree.byId.get(current.parentId) : undefined;
  }
  return slugs.join("/");
}
