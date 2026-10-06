import type { Business } from "@/data/businesses";
import { PLAN_LIMITS } from "../plan-limits.ts";

/** Seções reordenáveis/desativáveis (hero, barra de confiança e CTA flutuante são fixos). */
export const SECTION_KEYS = ["about", "services", "offer", "gallery", "reviews", "location", "faq", "cta"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

/** Ordem final: a escolhida pela empresa primeiro (chaves válidas, sem repetir), depois as restantes na ordem padrão; desativadas saem. */
export function resolveSectionOrder(order: readonly string[], disabled: readonly string[]): SectionKey[] {
  const known = new Set<string>(SECTION_KEYS);
  const picked = order.filter((key, index): key is SectionKey => known.has(key) && order.indexOf(key) === index);
  const rest = SECTION_KEYS.filter((key) => !picked.includes(key));
  return [...picked, ...rest].filter((key) => !disabled.includes(key));
}

export type LandingCapabilities = {
  maxServices: number;
  customCover: boolean;
  gallery: boolean;
  maxGalleryItems: number;
  video: boolean;
  faq: boolean;
  offer: boolean;
  leadForm: boolean;
  virtualTour: boolean;
  metrics: "none" | "basic" | "full";
};

/**
 * O que a landing mostra por plano. Quantidades (serviços, fotos) vêm de PLAN_LIMITS — a mesma fonte do editor e dos
 * textos de marketing, então a página nunca mostra mais do que o editor deixa cadastrar. Os recursos por plano seguem
 * a spec (Profissional: capa, galeria, FAQ, métricas básicas) e, acima dele, uma suposição: oferta e formulário no
 * Destaque, vídeo na Experiência, tour 3D só no Premium. Ajustar só aqui.
 * Pendente da análise de planos: a spec diz "Gratuito: até 3 serviços", mas PLAN_LIMITS.presenca.maxServices é 0.
 */
const FEATURES: Record<Business["plan"], Omit<LandingCapabilities, "maxServices" | "maxGalleryItems">> = {
  presenca: { customCover: false, gallery: false, video: false, faq: false, offer: false, leadForm: false, virtualTour: false, metrics: "none" },
  profissional: { customCover: true, gallery: true, video: false, faq: true, offer: false, leadForm: false, virtualTour: false, metrics: "basic" },
  destaque: { customCover: true, gallery: true, video: false, faq: true, offer: true, leadForm: true, virtualTour: false, metrics: "full" },
  experiencia: { customCover: true, gallery: true, video: true, faq: true, offer: true, leadForm: true, virtualTour: false, metrics: "full" },
  premium: { customCover: true, gallery: true, video: true, faq: true, offer: true, leadForm: true, virtualTour: true, metrics: "full" },
};

export function landingCapabilitiesFor(plan: Business["plan"]): LandingCapabilities {
  const limits = PLAN_LIMITS[plan];
  return { ...FEATURES[plan], maxServices: limits.maxServices, maxGalleryItems: limits.maxPhotos };
}

/** Taxa de conversão = ações de contato ÷ visualizações × 100 (0 quando não há visualização). */
export function conversionRate(contactActions: number, views: number): number {
  return views > 0 ? Math.round((contactActions / views) * 1000) / 10 : 0;
}
