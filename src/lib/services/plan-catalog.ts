import { createServiceClient } from "@/lib/supabase/server";
import {
  BUILT_IN_PLANS,
  DEFAULT_PLAN_DEFINITIONS,
  FEATURE_KEYS,
  FREE_PLAN,
  type FeatureMap,
  type FeatureValue,
  type PlanDefinition,
  type PlanKey,
} from "@/lib/plans/features";
import { DEFAULT_GRACE_DAYS, completeFeatures } from "@/lib/plans/resolve";

export type PlanCatalog = {
  plans: PlanDefinition[];
  /** recursos completos de cada plano (banco + padrão de fábrica nos que faltarem) */
  features: Record<PlanKey, FeatureMap>;
  graceDays: number;
  ranks: Record<PlanKey, number>;
  /** de onde veio: "database" ou "defaults" (banco indisponível) */
  source: "database" | "defaults";
};

const TTL_MS = 30_000;
let cache: { catalog: PlanCatalog; expiresAt: number } | null = null;

function fromDefaults(graceDays = DEFAULT_GRACE_DAYS): PlanCatalog {
  const plans = [...DEFAULT_PLAN_DEFINITIONS];
  return {
    plans,
    features: Object.fromEntries(plans.map((plan) => [plan.key, completeFeatures(undefined, plan.key)])),
    graceDays,
    ranks: Object.fromEntries(plans.map((plan) => [plan.key, plan.rank])),
    source: "defaults",
  };
}

type PlanRow = { key: string; name: string; description: string | null; rank: number; active: boolean; is_public: boolean; is_system: boolean; billing_type: "mensal" | "personalizado" };

async function loadFromDatabase(): Promise<PlanCatalog> {
  const supabase = createServiceClient();
  const [plansResult, featuresResult, settingsResult] = await Promise.all([
    supabase.from("plans").select("key, name, description, rank, active, is_public, is_system, billing_type").order("rank"),
    supabase.from("plan_features").select("plan_key, feature_key, value"),
    supabase.from("platform_settings").select("plan_grace_days").maybeSingle(),
  ]);
  if (plansResult.error || featuresResult.error || !plansResult.data?.length) throw plansResult.error ?? featuresResult.error ?? new Error("catálogo vazio");

  const plans: PlanDefinition[] = (plansResult.data as PlanRow[]).map((row) => ({
    key: row.key,
    name: row.name,
    description: row.description ?? "",
    rank: row.rank,
    active: row.active,
    isPublic: row.is_public,
    isSystem: row.is_system,
    billingType: row.billing_type,
  }));

  const byPlan = new Map<string, Record<string, FeatureValue>>();
  for (const row of featuresResult.data ?? []) {
    const bucket = byPlan.get(row.plan_key) ?? {};
    bucket[row.feature_key] = row.value as FeatureValue;
    byPlan.set(row.plan_key, bucket);
  }

  return {
    plans,
    features: Object.fromEntries(plans.map((plan) => [plan.key, completeFeatures(byPlan.get(plan.key), plan.key)])),
    graceDays: settingsResult.data?.plan_grace_days ?? DEFAULT_GRACE_DAYS,
    ranks: Object.fromEntries(plans.map((plan) => [plan.key, plan.rank])),
    source: "database",
  };
}

/** Catálogo de planos (cache de 30s por instância). Se o banco falhar, o site continua com o padrão de fábrica. */
export async function loadPlanCatalog(options: { fresh?: boolean } = {}): Promise<PlanCatalog> {
  if (!options.fresh && cache && cache.expiresAt > Date.now()) return cache.catalog;
  let catalog: PlanCatalog;
  try {
    catalog = await loadFromDatabase();
  } catch (error) {
    console.error("[plans] catálogo do banco indisponível, usando padrão de fábrica:", error);
    catalog = fromDefaults(cache?.catalog.graceDays);
  }
  cache = { catalog, expiresAt: Date.now() + TTL_MS };
  return catalog;
}

/** Invalida o cache (chamar depois de editar planos ou recursos no admin). */
export function invalidatePlanCatalog(): void {
  cache = null;
}

/** Leitura síncrona do que já está em cache (mapBusiness é síncrono): tolerância e posições dos planos. */
export function cachedPlanSettings(): { graceDays: number; ranks: Record<PlanKey, number> } {
  return cache ? { graceDays: cache.catalog.graceDays, ranks: cache.catalog.ranks } : { graceDays: DEFAULT_GRACE_DAYS, ranks: Object.fromEntries(DEFAULT_PLAN_DEFINITIONS.map((plan) => [plan.key, plan.rank])) };
}

/** Recursos do plano que já estão em cache (leitura síncrona para mapBusiness); undefined se o catálogo ainda não foi carregado. */
export function cachedFeaturesFor(plan: PlanKey): FeatureMap | undefined {
  return cache?.catalog.features[plan];
}

export function planNameFrom(catalog: PlanCatalog, key: PlanKey): string {
  return catalog.plans.find((plan) => plan.key === key)?.name ?? key;
}

/** Planos em ordem de upgrade (do mais barato ao mais caro), só os ativos. */
export function planLadder(catalog: PlanCatalog): { key: PlanKey; name: string; features: FeatureMap }[] {
  return catalog.plans
    .filter((plan) => plan.active)
    .sort((a, b) => a.rank - b.rank)
    .map((plan) => ({ key: plan.key, name: plan.name, features: catalog.features[plan.key] }));
}

export const isBuiltInPlan = (key: string): boolean => (BUILT_IN_PLANS as readonly string[]).includes(key);
export { FREE_PLAN, FEATURE_KEYS };
