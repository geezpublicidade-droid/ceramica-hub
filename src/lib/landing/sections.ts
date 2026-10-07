import type { Business } from "@/data/businesses";
import { DEFAULT_PLAN_FEATURES, type FeatureMap } from "../plans/features.ts";
import { canAccess, getFeatureValue, getLimit } from "../plans/resolve.ts";

/** Seções reordenáveis/desativáveis (hero, barra de confiança e CTA flutuante são fixos). */
export const SECTION_KEYS = ["about", "services", "offer", "gallery", "reviews", "location", "faq", "cta"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

/** Seções que cada layout pode mostrar. O perfil padronizado (Profissional/Destaque) não tem apresentação personalizada, FAQ nem chamada final. */
export const SECTIONS_BY_LAYOUT: Record<LandingLayout, readonly SectionKey[]> = {
  basic: [],
  standard: ["services", "offer", "gallery", "reviews", "location"],
  landing: SECTION_KEYS,
};

/** Ordem final: a escolhida pela empresa primeiro (chaves válidas, sem repetir), depois as restantes na ordem padrão; desativadas e não permitidas saem. */
export function resolveSectionOrder(order: readonly string[], disabled: readonly string[], allowed: readonly SectionKey[] = SECTION_KEYS): SectionKey[] {
  const known = new Set<string>(SECTION_KEYS);
  const picked = order.filter((key, index): key is SectionKey => known.has(key) && order.indexOf(key) === index);
  const rest = SECTION_KEYS.filter((key) => !picked.includes(key));
  return [...picked, ...rest].filter((key) => !disabled.includes(key) && allowed.includes(key));
}

export type LandingLayout = "basic" | "standard" | "landing";
export type MetricsLevel = "none" | "summary" | "basic" | "full" | "premium" | "campaign";

export type LandingCapabilities = {
  layout: LandingLayout;
  maxServices: number;
  maxGalleryItems: number;
  maxPromotions: number;
  maxVideos: number;
  /** foto de capa da empresa aparece no topo (perfil padronizado em diante) */
  coverImage: boolean;
  /** hero personalizado: imagem própria, título, texto e botão secundário */
  customCover: boolean;
  customSections: boolean;
  customCta: boolean;
  gallery: boolean;
  video: boolean;
  faq: boolean;
  offer: boolean;
  trackableCoupons: boolean;
  leadForm: boolean;
  virtualTour: boolean;
  fullDescription: boolean;
  whatsapp: boolean;
  socialMedia: boolean;
  businessHours: boolean;
  commercialInfo: boolean;
  servicePhotos: boolean;
  sponsoredBadge: boolean;
  featuredBadge: boolean;
  premiumBadge: boolean;
  metrics: MetricsLevel;
};

function metricsLevel(features: Readonly<FeatureMap>): MetricsLevel {
  if (canAccess(features, "metrics_campaign")) return "campaign";
  if (canAccess(features, "metrics_premium")) return "premium";
  if (canAccess(features, "metrics_full")) return "full";
  if (canAccess(features, "metrics_basic")) return "basic";
  return canAccess(features, "metrics_summary") ? "summary" : "none";
}

/** O que a página pública e o editor liberam, calculado a partir do MAPA DE RECURSOS (plano em vigor + overrides). Não olha o nome do plano. */
export function landingCapabilitiesFromFeatures(features: Readonly<FeatureMap>): LandingCapabilities {
  const layoutValue = getFeatureValue(features, "landing_layout");
  const layout: LandingLayout = layoutValue === "landing" || layoutValue === "standard" ? layoutValue : "basic";
  const maxGalleryItems = getLimit(features, "gallery_images");
  const maxPromotions = getLimit(features, "active_promotions");
  const maxVideos = getLimit(features, "featured_videos");

  return {
    layout,
    maxServices: getLimit(features, "services"),
    maxGalleryItems,
    maxPromotions,
    maxVideos,
    coverImage: layout !== "basic",
    customCover: canAccess(features, "custom_hero"),
    customSections: canAccess(features, "custom_sections"),
    customCta: canAccess(features, "custom_cta"),
    gallery: maxGalleryItems > 0,
    video: maxVideos > 0,
    faq: canAccess(features, "faq"),
    offer: maxPromotions > 0,
    trackableCoupons: canAccess(features, "trackable_coupons"),
    leadForm: canAccess(features, "lead_forms"),
    virtualTour: canAccess(features, "tour_3d"),
    fullDescription: canAccess(features, "full_description"),
    whatsapp: canAccess(features, "whatsapp"),
    socialMedia: canAccess(features, "social_media"),
    businessHours: canAccess(features, "business_hours"),
    commercialInfo: canAccess(features, "commercial_info"),
    servicePhotos: canAccess(features, "service_photos"),
    sponsoredBadge: canAccess(features, "sponsored_badge"),
    featuredBadge: canAccess(features, "featured_badge"),
    premiumBadge: canAccess(features, "premium_badge"),
    metrics: metricsLevel(features),
  };
}

/** Capacidades do padrão de fábrica de um plano (testes, simulação sem banco). Para uma empresa real use as permissões dela. */
export function landingCapabilitiesFor(plan: Business["plan"]): LandingCapabilities {
  return landingCapabilitiesFromFeatures(DEFAULT_PLAN_FEATURES[plan]);
}

/** Taxa de conversão = ações de contato ÷ visualizações × 100 (0 quando não há visualização). */
export function conversionRate(contactActions: number, views: number): number {
  return views > 0 ? Math.round((contactActions / views) * 1000) / 10 : 0;
}
