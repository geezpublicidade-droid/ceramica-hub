import type { Business } from "@/data/businesses";

export type PlanLimits = {
  maxServices: number;
  maxPhotos: number;
  maxPromotions: number;
  couponsAllowed: boolean;
  videoAllowed: boolean;
  virtualTourAllowed: boolean;
  featuredAllowed: boolean;
};

export const PLAN_LIMITS: Record<Business["plan"], PlanLimits> = {
  presenca: { maxServices: 0, maxPhotos: 0, maxPromotions: 0, couponsAllowed: false, videoAllowed: false, virtualTourAllowed: false, featuredAllowed: false },
  profissional: { maxServices: 3, maxPhotos: 3, maxPromotions: 1, couponsAllowed: false, videoAllowed: false, virtualTourAllowed: false, featuredAllowed: false },
  destaque: { maxServices: 6, maxPhotos: 6, maxPromotions: 4, couponsAllowed: true, videoAllowed: false, virtualTourAllowed: false, featuredAllowed: true },
  experiencia: { maxServices: Infinity, maxPhotos: 30, maxPromotions: 4, couponsAllowed: true, videoAllowed: true, virtualTourAllowed: true, featuredAllowed: true },
};

export function limitsFor(plan: Business["plan"]): PlanLimits {
  return PLAN_LIMITS[plan];
}

/** Ordem de autoatendimento (Patrocinador fica fora -- não é selecionável). */
export const PLAN_ORDER: Business["plan"][] = ["presenca", "profissional", "destaque", "experiencia"];

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
export type PayablePlan = "profissional" | "destaque" | "experiencia";

export const PLAN_PRICES_CENTS: Record<PayablePlan, number> = {
  profissional: 4700,
  destaque: 9700,
  experiencia: 19700,
};

/** Preço "de vitrine" (arredondado, sem centavos) -- usado em Pricing.tsx e
 * nas páginas /planos/[plano]. Cobrança de verdade usa PLAN_PRICES_CENTS. */
export const PLAN_PRICE_DISPLAY: Record<Business["plan"], { price: string; hasPeriod: boolean }> = {
  presenca: { price: "R$ 0", hasPeriod: false },
  profissional: { price: "R$ 47", hasPeriod: true },
  destaque: { price: "R$ 97", hasPeriod: true },
  experiencia: { price: "R$ 197", hasPeriod: true },
};
