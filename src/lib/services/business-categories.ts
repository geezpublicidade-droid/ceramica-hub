import { createServiceClient } from "@/lib/supabase/server";
import { getCategoryTree } from "@/lib/services/categories";

/** Macros com subcategorias e especialidades aninhadas, no formato simples que os formulários usam. */
export async function getCategoryGroups() {
  const tree = await getCategoryTree();
  return tree.roots.map((root) => ({
    id: root.id,
    name: root.name,
    children: root.children.map((sub) => ({
      id: sub.id,
      name: sub.name,
      children: sub.children.map((spec) => ({ id: spec.id, name: spec.name })),
    })),
  }));
}

/** Ids de categoria vinculados à empresa (primária e extras). */
export async function getBusinessCategoryIds(businessId: string): Promise<{ primaryId: string | null; extraIds: string[] }> {
  const { data, error } = await createServiceClient()
    .from("business_categories")
    .select("category_id, is_primary")
    .eq("business_id", businessId);
  if (error) throw error;
  const rows = data ?? [];
  return {
    primaryId: (rows.find((row) => row.is_primary)?.category_id as string | undefined) ?? null,
    extraIds: rows.filter((row) => !row.is_primary).map((row) => row.category_id as string),
  };
}

/**
 * Substitui as categorias extras da empresa (subcategorias, especialidades ou outras macros).
 * A macro primária continua sendo a de `businesses.category` e é mantida pelo trigger do banco,
 * por isso nunca é apagada aqui. Ids inexistentes ou inativos são ignorados.
 */
export async function linkBusinessCategories(businessId: string, categoryIds: string[]): Promise<void> {
  const supabase = createServiceClient();
  const wanted = [...new Set(categoryIds)];

  const { data: valid, error: validError } = wanted.length
    ? await supabase.from("categories").select("id").in("id", wanted).eq("active", true)
    : { data: [], error: null };
  if (validError) throw validError;
  const validIds = new Set((valid ?? []).map((row) => row.id as string));

  const { primaryId } = await getBusinessCategoryIds(businessId);
  const { error: deleteError } = await supabase
    .from("business_categories")
    .delete()
    .eq("business_id", businessId)
    .eq("is_primary", false);
  if (deleteError) throw deleteError;

  const rows = wanted
    .filter((id) => validIds.has(id) && id !== primaryId)
    .map((categoryId) => ({ business_id: businessId, category_id: categoryId, is_primary: false }));
  if (rows.length === 0) return;
  const { error: insertError } = await supabase.from("business_categories").insert(rows);
  if (insertError) throw insertError;
}
