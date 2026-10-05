import { createServiceClient } from "@/lib/supabase/server";
import { SHOWCASE_COLUMNS, rowToContent, type CategoryContent, type ShowcaseRow } from "@/lib/category-content";
import { categoryBreadcrumb, getCategoryTree } from "@/lib/services/categories";

export type AdminCategoryContent = {
  id: string;
  label: string;
  level: number;
  slug: string;
  content: CategoryContent;
};

/** Macrocategorias e subcategorias com o conteúdo da vitrine (especialidades herdam da subcategoria). */
export async function listCategoryContent(): Promise<AdminCategoryContent[]> {
  const [tree, rows] = await Promise.all([
    getCategoryTree(),
    createServiceClient().from("categories").select(SHOWCASE_COLUMNS).eq("active", true),
  ]);
  if (rows.error) throw rows.error;
  const byId = new Map(((rows.data ?? []) as unknown as ShowcaseRow[]).map((row) => [row.id, rowToContent(row)]));

  const result: AdminCategoryContent[] = [];
  const walk = (nodes: typeof tree.roots) => {
    for (const node of nodes) {
      if (node.level > 2) continue;
      result.push({
        id: node.id,
        label: categoryBreadcrumb(tree, node),
        level: node.level,
        slug: node.slug,
        content: byId.get(node.id)!,
      });
      walk(node.children);
    }
  };
  walk(tree.roots);
  return result;
}

export async function updateCategoryContent(id: string, content: CategoryContent): Promise<void> {
  const { error } = await createServiceClient()
    .from("categories")
    .update({
      hero_title: content.heroTitle,
      hero_description: content.heroDescription,
      hero_helper: content.heroHelper,
      hero_image_url: content.heroImageUrl,
      hero_image_mobile_url: content.heroImageMobileUrl,
      hero_image_alt: content.heroImageAlt,
      highlights_text: content.highlightsText,
      seo_text: content.seoText,
      ad_enabled: content.adEnabled,
      ad_eyebrow: content.adEyebrow,
      ad_text: content.adText,
      ad_cta_label: content.adCtaLabel,
      ad_cta_url: content.adCtaUrl,
    })
    .eq("id", id);
  if (error) throw error;
}
