import { createServiceClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/services/categories";
import { SHOWCASE_COLUMNS, resolveContent, rowToContent, type CategoryContent, type ShowcaseRow } from "@/lib/category-content";

export type { CategoryContent };

/** Conteúdo resolvido da vitrine para o caminho macro > sub > especialidade. */
export async function getCategoryContent(trail: Category[]): Promise<CategoryContent> {
  const { data, error } = await createServiceClient()
    .from("categories")
    .select(SHOWCASE_COLUMNS)
    .in(
      "id",
      trail.map((category) => category.id),
    );
  if (error) throw error;
  const byId = new Map(((data ?? []) as ShowcaseRow[]).map((row) => [row.id, rowToContent(row)]));
  return resolveContent(trail, byId);
}
