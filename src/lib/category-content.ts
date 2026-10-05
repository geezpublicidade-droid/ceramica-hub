import type { Category } from "./services/categories.ts";

/** Conteúdo editável da vitrine de uma categoria (colunas de `categories`; nulo = usa o padrão). */
export type CategoryContent = {
  heroTitle: string | null;
  heroDescription: string | null;
  heroHelper: string | null;
  heroImageUrl: string | null;
  heroImageMobileUrl: string | null;
  heroImageAlt: string | null;
  highlightsText: string | null;
  seoText: string | null;
  adEnabled: boolean;
  adEyebrow: string | null;
  adText: string | null;
  adCtaLabel: string | null;
  adCtaUrl: string | null;
};

export const SHOWCASE_COLUMNS =
  "id, hero_title, hero_description, hero_helper, hero_image_url, hero_image_mobile_url, hero_image_alt, highlights_text, seo_text, ad_enabled, ad_eyebrow, ad_text, ad_cta_label, ad_cta_url";

export type ShowcaseRow = {
  id: string;
  hero_title: string | null;
  hero_description: string | null;
  hero_helper: string | null;
  hero_image_url: string | null;
  hero_image_mobile_url: string | null;
  hero_image_alt: string | null;
  highlights_text: string | null;
  seo_text: string | null;
  ad_enabled: boolean;
  ad_eyebrow: string | null;
  ad_text: string | null;
  ad_cta_label: string | null;
  ad_cta_url: string | null;
};

export const EMPTY_CONTENT: CategoryContent = {
  heroTitle: null,
  heroDescription: null,
  heroHelper: null,
  heroImageUrl: null,
  heroImageMobileUrl: null,
  heroImageAlt: null,
  highlightsText: null,
  seoText: null,
  adEnabled: true,
  adEyebrow: null,
  adText: null,
  adCtaLabel: null,
  adCtaUrl: null,
};

export function rowToContent(row: ShowcaseRow): CategoryContent {
  return {
    heroTitle: row.hero_title,
    heroDescription: row.hero_description,
    heroHelper: row.hero_helper,
    heroImageUrl: row.hero_image_url,
    heroImageMobileUrl: row.hero_image_mobile_url,
    heroImageAlt: row.hero_image_alt,
    highlightsText: row.highlights_text,
    seoText: row.seo_text,
    adEnabled: row.ad_enabled,
    adEyebrow: row.ad_eyebrow,
    adText: row.ad_text,
    adCtaLabel: row.ad_cta_label,
    adCtaUrl: row.ad_cta_url,
  };
}

/**
 * Junta o conteúdo da categoria com o das ancestrais: cada campo vem da categoria mais
 * específica que o preencheu (subcategoria herda imagem, painel e textos da macro).
 * Só o texto de SEO não herda, porque descreve a página específica. `trail` vai da macro à categoria atual.
 */
export function resolveContent(trail: Category[], byId: ReadonlyMap<string, CategoryContent>): CategoryContent {
  const resolved: CategoryContent = { ...EMPTY_CONTENT };
  const ownSeo = byId.get(trail[trail.length - 1]?.id)?.seoText ?? null;
  for (const category of trail) {
    const content = byId.get(category.id);
    if (!content) continue;
    for (const key of Object.keys(content) as (keyof CategoryContent)[]) {
      if (key === "adEnabled") continue;
      const value = content[key];
      if (value !== null && value !== "") (resolved as Record<string, unknown>)[key] = value;
    }
    // desligar o painel numa subcategoria vale só para ela; a macro desligada desliga as filhas
    resolved.adEnabled = resolved.adEnabled && content.adEnabled;
  }
  resolved.seoText = ownSeo;
  return resolved;
}

