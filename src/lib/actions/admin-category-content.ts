"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import { logAdminAction } from "@/lib/audit-log";
import { isAllowedUrl } from "@/lib/category-page";
import type { CategoryContent } from "@/lib/category-content";
import { updateCategoryContent } from "@/lib/services/category-content-admin";

type ActionResult = { success: true } | { success: false; error: string };

const PAGE = "/admin/publicidade/categorias/conteudo";

const TEXT_LIMITS: Partial<Record<keyof CategoryContent, number>> = {
  heroTitle: 120,
  heroDescription: 300,
  heroHelper: 160,
  heroImageAlt: 160,
  highlightsText: 160,
  adEyebrow: 60,
  adText: 200,
  adCtaLabel: 30,
  seoText: 3000,
  heroImageUrl: 500,
  heroImageMobileUrl: 500,
  adCtaUrl: 500,
};

const URL_FIELDS: (keyof CategoryContent)[] = ["heroImageUrl", "heroImageMobileUrl", "adCtaUrl"];

/** Conteúdo da vitrine de uma categoria (hero, painel comercial, SEO). Vazio volta ao texto padrão. */
export async function updateCategoryContentAction(id: string, input: CategoryContent): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin", "marketing"]);
  const content = { ...input } as Record<string, unknown>;
  for (const [key, limit] of Object.entries(TEXT_LIMITS) as [keyof CategoryContent, number][]) {
    const value = String(input[key] ?? "").trim();
    if (value.length > limit) return { success: false, error: "Um dos textos passou do tamanho permitido." };
    if (URL_FIELDS.includes(key) && !isAllowedUrl(value)) {
      return { success: false, error: "Use endereços começando com https:// ou /." };
    }
    content[key] = value || null;
  }
  content.adEnabled = Boolean(input.adEnabled);
  await updateCategoryContent(id, content as CategoryContent);
  await logAdminAction(adminId, "update_category_content", "category", id, { fields: Object.keys(TEXT_LIMITS) });
  revalidatePath(PAGE);
  return { success: true };
}
