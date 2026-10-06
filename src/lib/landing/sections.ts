import type { Business } from "@/data/businesses";

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
 * O que a landing mostra por plano. Gratuito e Profissional seguem a spec (Gratuito: básico + até 3 serviços;
 * Profissional: capa, mais serviços, galeria, FAQ e métricas básicas). Os planos acima são extrapolação
 * (oferta/formulário no Destaque, vídeo na Experiência, tour 3D só no Premium) — ajustar só aqui.
 */
export const LANDING_CAPABILITIES: Record<Business["plan"], LandingCapabilities> = {
  presenca: { maxServices: 3, customCover: false, gallery: false, maxGalleryItems: 0, video: false, faq: false, offer: false, leadForm: false, virtualTour: false, metrics: "none" },
  profissional: { maxServices: 6, customCover: true, gallery: true, maxGalleryItems: 6, video: false, faq: true, offer: false, leadForm: false, virtualTour: false, metrics: "basic" },
  destaque: { maxServices: 9, customCover: true, gallery: true, maxGalleryItems: 12, video: false, faq: true, offer: true, leadForm: true, virtualTour: false, metrics: "full" },
  experiencia: { maxServices: Infinity, customCover: true, gallery: true, maxGalleryItems: 30, video: true, faq: true, offer: true, leadForm: true, virtualTour: false, metrics: "full" },
  premium: { maxServices: Infinity, customCover: true, gallery: true, maxGalleryItems: 30, video: true, faq: true, offer: true, leadForm: true, virtualTour: true, metrics: "full" },
};

export function landingCapabilitiesFor(plan: Business["plan"]): LandingCapabilities {
  return LANDING_CAPABILITIES[plan];
}

/** Taxa de conversão = ações de contato ÷ visualizações × 100 (0 quando não há visualização). */
export function conversionRate(contactActions: number, views: number): number {
  return views > 0 ? Math.round((contactActions / views) * 1000) / 10 : 0;
}
