import type { Business } from "@/data/businesses";
import { DEFAULT_PLAN_FEATURES, type FeatureMap } from "@/lib/plans/features";
import { canAccess, getLimit } from "@/lib/plans/resolve";

/**
 * Visão compatível (maxServices, maxPhotos...) dos recursos de um plano. A fonte de verdade é a matriz central
 * (src/lib/plans/features.ts + tabela plan_features); este formato só existe para os componentes antigos.
 * Para uma EMPRESA use getCompanyPermissions (considera status, tolerância e overrides).
 */
export type PlanLimits = {
  maxServices: number;
  maxPhotos: number;
  maxPromotions: number;
  couponsAllowed: boolean;
  videoAllowed: boolean;
  virtualTourAllowed: boolean;
  featuredAllowed: boolean;
};

export function limitsFromFeatures(features: Readonly<FeatureMap>): PlanLimits {
  return {
    maxServices: getLimit(features, "services"),
    maxPhotos: getLimit(features, "gallery_images"),
    maxPromotions: getLimit(features, "active_promotions"),
    couponsAllowed: canAccess(features, "trackable_coupons"),
    videoAllowed: canAccess(features, "featured_videos"),
    virtualTourAllowed: canAccess(features, "tour_3d"),
    featuredAllowed: canAccess(features, "rotating_card"),
  };
}

/** Padrão de fábrica por plano (sem overrides nem edições do admin). */
export const PLAN_LIMITS = Object.fromEntries(
  (Object.keys(DEFAULT_PLAN_FEATURES) as Business["plan"][]).map((plan) => [plan, limitsFromFeatures(DEFAULT_PLAN_FEATURES[plan])]),
) as Record<Business["plan"], PlanLimits>;

export function limitsFor(plan: Business["plan"]): PlanLimits {
  return PLAN_LIMITS[plan];
}

/** Ordem de autoatendimento (Patrocinador fica fora -- não é selecionável). */
export const PLAN_ORDER: Business["plan"][] = ["presenca", "profissional", "destaque", "experiencia", "premium"];

/** Primeiro plano acima do atual que desbloqueia mais desse recurso -- usado
 * pra linkar os avisos de "recurso do plano superior" direto pra página do
 * plano certo, em vez de um "conheça os planos" genérico. */
export function upgradeTargetPlan(currentPlan: Business["plan"], capability: keyof PlanLimits): Business["plan"] | null {
  const currentValue = PLAN_LIMITS[currentPlan][capability];
  const currentIndex = PLAN_ORDER.indexOf(currentPlan);
  for (let i = currentIndex + 1; i < PLAN_ORDER.length; i++) {
    const plan = PLAN_ORDER[i];
    const value = PLAN_LIMITS[plan][capability];
    const unlocksMore = typeof value === "boolean" ? value && !currentValue : value > (currentValue as number);
    if (unlocksMore) return plan;
  }
  return null;
}

/** Planos pagáveis (presença é gratuito, nunca gera fatura). Preço em centavos — mesmo valor hoje exibido em Pricing.tsx. */
export type PayablePlan = "profissional" | "destaque" | "experiencia" | "premium";

export const PLAN_PRICES_CENTS: Record<PayablePlan, number> = {
  profissional: 7900,
  destaque: 14700,
  experiencia: 29700,
  premium: 49700,
};

/** Preço "de vitrine" (arredondado, sem centavos) -- usado em Pricing.tsx e
 * nas páginas /planos/[plano]. Cobrança de verdade usa PLAN_PRICES_CENTS. */
export const PLAN_PRICE_DISPLAY: Record<Business["plan"], { price: string; hasPeriod: boolean }> = {
  presenca: { price: "R$ 0", hasPeriod: false },
  profissional: { price: "R$ 79", hasPeriod: true },
  destaque: { price: "R$ 147", hasPeriod: true },
  experiencia: { price: "R$ 297", hasPeriod: true },
  premium: { price: "R$ 497", hasPeriod: true },
  patrocinador: { price: "Sob consulta", hasPeriod: false },
};
