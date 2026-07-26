import type { Business } from "@/data/businesses";

export type PlanLimits = {
  maxServices: number;
  maxPhotos: number;
  maxPromotions: number;
  couponsAllowed: boolean;
  videoAllowed: boolean;
  virtualTourAllowed: boolean;
};

export const PLAN_LIMITS: Record<Business["plan"], PlanLimits> = {
  presenca: { maxServices: 3, maxPhotos: 1, maxPromotions: 0, couponsAllowed: false, videoAllowed: false, virtualTourAllowed: false },
  profissional: { maxServices: 10, maxPhotos: 10, maxPromotions: 1, couponsAllowed: false, videoAllowed: false, virtualTourAllowed: false },
  destaque: { maxServices: Infinity, maxPhotos: 20, maxPromotions: 4, couponsAllowed: true, videoAllowed: false, virtualTourAllowed: false },
  experiencia: { maxServices: Infinity, maxPhotos: 30, maxPromotions: 4, couponsAllowed: true, videoAllowed: true, virtualTourAllowed: true },
};

export function limitsFor(plan: Business["plan"]): PlanLimits {
  return PLAN_LIMITS[plan];
}

/** Planos pagáveis (presença é gratuito, nunca gera fatura). Preço em centavos — mesmo valor hoje exibido em Pricing.tsx. */
export type PayablePlan = "profissional" | "destaque" | "experiencia";

export const PLAN_PRICES_CENTS: Record<PayablePlan, number> = {
  profissional: 4700,
  destaque: 9700,
  experiencia: 19700,
};
