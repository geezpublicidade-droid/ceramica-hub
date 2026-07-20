import type { Business } from "@/data/businesses";

export type PlanLimits = {
  maxServices: number;
  maxPhotos: number;
  maxPromotions: number;
  couponsAllowed: boolean;
  videoAllowed: boolean;
};

export const PLAN_LIMITS: Record<Business["plan"], PlanLimits> = {
  presenca: { maxServices: 3, maxPhotos: 1, maxPromotions: 0, couponsAllowed: false, videoAllowed: false },
  profissional: { maxServices: 10, maxPhotos: 10, maxPromotions: 1, couponsAllowed: false, videoAllowed: false },
  destaque: { maxServices: Infinity, maxPhotos: 20, maxPromotions: 4, couponsAllowed: true, videoAllowed: false },
  experiencia: { maxServices: Infinity, maxPhotos: 30, maxPromotions: 4, couponsAllowed: true, videoAllowed: true },
};

export function limitsFor(plan: Business["plan"]): PlanLimits {
  return PLAN_LIMITS[plan];
}
