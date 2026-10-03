import { createServiceClient } from "@/lib/supabase/server";
import { categoryBreadcrumb, categoryPath, findCategoryByPath, getCategoryTree, type Category } from "@/lib/services/categories";
import { todaySaoPaulo } from "@/lib/placement-rules";

/** Uma posição à venda numa categoria, como o público vê: preço do produto e vagas livres hoje. */
export type CategoryOffer = {
  typeKey: string;
  maxSlots: number;
  freeSlots: number;
  /** null = preço ainda não definido em Produtos ("sob consulta") */
  monthlyPriceCents: number | null;
};

export type CategoryOffers = {
  category: Category;
  label: string;
  path: string;
  offers: CategoryOffer[];
};

/** Categorias (até subcategoria) que podem receber posição paga, para o seletor da página de planos. */
export async function getSellableCategories(locale: string): Promise<{ path: string; label: string }[]> {
  const tree = await getCategoryTree(locale);
  const options: { path: string; label: string }[] = [];
  const walk = (nodes: Category[]) => {
    for (const node of nodes) {
      if (node.level > 2) continue;
      options.push({ path: categoryPath(tree, node), label: categoryBreadcrumb(tree, node) });
      walk(node.children);
    }
  };
  walk(tree.roots);
  return options;
}

/**
 * Posições à venda numa categoria. `path` vem da URL (`saude-e-estetica/dentistas`); caminho
 * inválido ou de especialidade (nível 3, que não tem posição própria) devolve null.
 */
export async function getCategoryOffers(path: string, locale: string): Promise<CategoryOffers | null> {
  const tree = await getCategoryTree(locale);
  const trail = findCategoryByPath(tree, path.split("/").filter(Boolean));
  const category = trail?.[trail.length - 1];
  if (!category || category.level > 2) return null;

  const supabase = createServiceClient();
  const today = todaySaoPaulo();
  const [types, occupied] = await Promise.all([
    supabase
      .from("placement_types")
      .select("id, key, max_slots, products(monthly_price_cents)")
      .eq("active", true)
      .order("sort_order"),
    supabase
      .from("category_placements")
      .select("placement_type_id")
      .eq("category_id", category.id)
      .in("status", ["reserved", "active", "paused"])
      .lte("starts_at", today)
      .gte("ends_at", today),
  ]);
  if (types.error) throw types.error;
  if (occupied.error) throw occupied.error;

  const occupiedByType = new Map<string, number>();
  for (const row of occupied.data ?? []) {
    occupiedByType.set(row.placement_type_id, (occupiedByType.get(row.placement_type_id) ?? 0) + 1);
  }

  return {
    category,
    label: categoryBreadcrumb(tree, category),
    path: categoryPath(tree, category),
    offers: (types.data ?? []).map((row) => ({
      typeKey: row.key,
      maxSlots: row.max_slots,
      freeSlots: Math.max(0, row.max_slots - (occupiedByType.get(row.id) ?? 0)),
      monthlyPriceCents: (row.products as unknown as { monthly_price_cents: number | null } | null)?.monthly_price_cents ?? null,
    })),
  };
}
