import { createServiceClient } from "@/lib/supabase/server";
import { PLAN_PRICES_CENTS } from "@/lib/plan-limits";
import type { PlanKey } from "@/lib/plans/features";

export type PlanPrice = { plan: PlanKey; monthlyCents: number | null; yearlyCents: number | null; billingType: "mensal" | "anual" | "unico" | "personalizado" };

const TTL_MS = 30_000;
let cache: { prices: Record<PlanKey, PlanPrice>; expiresAt: number } | null = null;

function fromConstants(): Record<PlanKey, PlanPrice> {
  const prices: Record<PlanKey, PlanPrice> = {
    presenca: { plan: "presenca", monthlyCents: 0, yearlyCents: 0, billingType: "mensal" },
    patrocinador: { plan: "patrocinador", monthlyCents: null, yearlyCents: null, billingType: "personalizado" },
  };
  for (const [plan, cents] of Object.entries(PLAN_PRICES_CENTS)) prices[plan] = { plan, monthlyCents: cents, yearlyCents: cents * 10, billingType: "mensal" };
  return prices;
}

/** Preços dos planos vindos do catálogo comercial (tabela `products`, editável em /admin/produtos). Constantes só como fallback. */
export async function loadPlanPrices(): Promise<Record<PlanKey, PlanPrice>> {
  if (cache && cache.expiresAt > Date.now()) return cache.prices;
  const prices = fromConstants();
  try {
    const { data } = await createServiceClient().from("products").select("plan_key, monthly_price_cents, yearly_price_cents, billing_type").eq("category", "plano").not("plan_key", "is", null);
    for (const row of data ?? []) {
      prices[row.plan_key] = { plan: row.plan_key, monthlyCents: row.monthly_price_cents ?? null, yearlyCents: row.yearly_price_cents ?? null, billingType: row.billing_type };
    }
  } catch (error) {
    console.error("[plans] preços do catálogo indisponíveis, usando padrão:", error);
  }
  cache = { prices, expiresAt: Date.now() + TTL_MS };
  return prices;
}

export function invalidatePlanPrices(): void {
  cache = null;
}

/** Valor mensal em centavos a cobrar por um plano; null se for sob consulta/gratuito. */
export async function getPlanPriceCents(plan: PlanKey): Promise<number | null> {
  const price = (await loadPlanPrices())[plan];
  return price && price.monthlyCents && price.monthlyCents > 0 ? price.monthlyCents : null;
}
