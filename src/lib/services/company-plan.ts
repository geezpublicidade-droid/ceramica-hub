import { createServiceClient } from "@/lib/supabase/server";
import { canAccess, getLimit, resolveEffectivePlan, resolveFeatures, type BillingCycle, type EffectivePlan, type FeatureOverride, type PlanStatus } from "@/lib/plans/resolve";
import { featureDefinition, normalizeFeatureKey, type FeatureKey, type FeatureMap, type FeatureValue, type PlanKey } from "@/lib/plans/features";
import { loadPlanCatalog, planLadder, planNameFrom, type PlanCatalog } from "@/lib/services/plan-catalog";

export type CompanyPermissions = {
  businessId: string;
  /** plano contratado */
  contractedPlan: PlanKey;
  /** plano em vigor agora (considera status, vencimento, tolerância, cortesia e teste) */
  plan: PlanKey;
  planName: string;
  contractedPlanName: string;
  status: PlanStatus;
  effective: EffectivePlan;
  billingCycle: BillingCycle;
  manualOverride: boolean;
  startedAt: string | null;
  expiresAt: string | null;
  discountPercent: number | null;
  notes: string | null;
  ownerValidated: boolean;
  /** recursos já resolvidos (plano em vigor + overrides ativos) */
  features: FeatureMap;
  overrides: (FeatureOverride & { id: string; reason: string | null; createdAt: string })[];
};

/** O subconjunto seguro para serializar ao navegador (PlanProvider). Não há segredo aqui: só o que a empresa já vê. */
export type ClientPermissions = Pick<
  CompanyPermissions,
  "businessId" | "contractedPlan" | "plan" | "planName" | "status" | "features" | "expiresAt" | "ownerValidated"
> & { inGrace: boolean; graceEndsAt: string | null; daysUntilExpiry: number | null; downgraded: boolean };

export function toClientPermissions(permissions: CompanyPermissions): ClientPermissions {
  const { businessId, contractedPlan, plan, planName, status, features, expiresAt, ownerValidated, effective } = permissions;
  return {
    businessId,
    contractedPlan,
    plan,
    planName,
    status,
    features,
    expiresAt,
    ownerValidated,
    inGrace: effective.inGrace,
    graceEndsAt: effective.graceEndsAt,
    daysUntilExpiry: effective.daysUntilExpiry,
    downgraded: effective.downgraded,
  };
}

const PLAN_COLUMNS =
  "id, plan, plan_status, plan_started_at, plan_expires_at, plan_updated_at, billing_cycle, manual_override, plan_discount_percent, plan_notes, owner_validated, trial_status, trial_plan, trial_ends_at";

type PlanRow = {
  id: string;
  plan: string;
  plan_status: PlanStatus;
  plan_started_at: string | null;
  plan_expires_at: string | null;
  plan_updated_at: string | null;
  billing_cycle: BillingCycle;
  manual_override: boolean;
  plan_discount_percent: number | null;
  plan_notes: string | null;
  owner_validated: boolean;
  trial_status: "none" | "active" | "expired";
  trial_plan: string | null;
  trial_ends_at: string | null;
};

type OverrideRow = { id: string; business_id: string; feature_key: string; value: FeatureValue; reason: string | null; starts_at: string | null; expires_at: string | null; created_at: string };

function mapOverride(row: OverrideRow) {
  return { id: row.id, featureKey: row.feature_key, value: row.value, reason: row.reason, startsAt: row.starts_at, expiresAt: row.expires_at, createdAt: row.created_at };
}

function buildPermissions(row: PlanRow, catalog: PlanCatalog, overrideRows: OverrideRow[]): CompanyPermissions {
  const effective = resolveEffectivePlan(
    {
      plan: row.plan,
      status: row.plan_status,
      startedAt: row.plan_started_at,
      expiresAt: row.plan_expires_at,
      updatedAt: row.plan_updated_at,
      manualOverride: row.manual_override,
      trial: { status: row.trial_status, plan: row.trial_plan, endsAt: row.trial_ends_at },
    },
    { graceDays: catalog.graceDays, ranks: catalog.ranks },
  );
  const overrides = overrideRows.map(mapOverride);
  return {
    businessId: row.id,
    contractedPlan: row.plan,
    plan: effective.plan,
    planName: planNameFrom(catalog, effective.plan),
    contractedPlanName: planNameFrom(catalog, row.plan),
    status: row.plan_status,
    effective,
    billingCycle: row.billing_cycle,
    manualOverride: row.manual_override,
    startedAt: row.plan_started_at,
    expiresAt: row.plan_expires_at,
    discountPercent: row.plan_discount_percent,
    notes: row.plan_notes,
    ownerValidated: row.owner_validated,
    features: resolveFeatures(catalog.features[effective.plan], effective.plan, overrides),
    overrides,
  };
}

/** Tudo o que a empresa pode fazer agora. null se a empresa não existe. É a ÚNICA fonte para decidir permissões no servidor. */
export async function getCompanyPermissions(businessId: string): Promise<CompanyPermissions | null> {
  const supabase = createServiceClient();
  const [catalog, business, overrides] = await Promise.all([
    loadPlanCatalog(),
    supabase.from("businesses").select(PLAN_COLUMNS).eq("id", businessId).maybeSingle(),
    supabase.from("company_feature_overrides").select("id, business_id, feature_key, value, reason, starts_at, expires_at, created_at").eq("business_id", businessId),
  ]);
  if (business.error || !business.data) return null;
  return buildPermissions(business.data as PlanRow, catalog, (overrides.data ?? []) as OverrideRow[]);
}

/** Recursos de várias empresas de uma vez (listagens públicas). Usa o plano em vigor já calculado + overrides ativos. */
export async function getFeaturesForBusinesses(businesses: readonly { id: string; effectivePlan: PlanKey }[]): Promise<Map<string, FeatureMap>> {
  const catalog = await loadPlanCatalog();
  const ids = [...new Set(businesses.map((business) => business.id))];
  const overridesByBusiness = new Map<string, OverrideRow[]>();
  if (ids.length > 0) {
    const { data } = await createServiceClient().from("company_feature_overrides").select("id, business_id, feature_key, value, reason, starts_at, expires_at, created_at").in("business_id", ids);
    for (const row of (data ?? []) as OverrideRow[]) overridesByBusiness.set(row.business_id, [...(overridesByBusiness.get(row.business_id) ?? []), row]);
  }
  return new Map(
    businesses.map((business) => [
      business.id,
      resolveFeatures(catalog.features[business.effectivePlan], business.effectivePlan, (overridesByBusiness.get(business.id) ?? []).map(mapOverride)),
    ]),
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Verificações de backend (as ações de escrita chamam estas; esconder botão na tela não basta)
// ---------------------------------------------------------------------------------------------------------------

export type GateResult = { ok: true; permissions: CompanyPermissions } | { ok: false; error: string; code: "NOT_FOUND" | "PLAN_FEATURE" | "PLAN_LIMIT"; requiredPlan: PlanKey | null };

async function requiredPlanFor(key: string, catalog: PlanCatalog): Promise<PlanKey | null> {
  return planLadder(catalog).find((plan) => canAccess(plan.features, key))?.key ?? null;
}

async function upgradeHint(key: string): Promise<{ plan: PlanKey | null; text: string }> {
  const catalog = await loadPlanCatalog();
  const plan = await requiredPlanFor(key, catalog);
  return { plan, text: plan ? ` Disponível no plano ${planNameFrom(catalog, plan)}.` : "" };
}

/** Bloqueia quando o recurso não está liberado no plano em vigor. */
export async function gateFeature(businessId: string, key: string, label?: string): Promise<GateResult> {
  const permissions = await getCompanyPermissions(businessId);
  if (!permissions) return { ok: false, error: "Empresa não encontrada.", code: "NOT_FOUND", requiredPlan: null };
  if (canAccess(permissions.features, key)) return { ok: true, permissions };
  const normalized = normalizeFeatureKey(key);
  const name = label ?? (normalized ? featureDefinition(normalized)?.label : undefined) ?? key;
  const hint = await upgradeHint(key);
  return { ok: false, error: `${name} não está incluído no seu plano.${hint.text}`, code: "PLAN_FEATURE", requiredPlan: hint.plan };
}

/** Bloqueia quando `currentCount` já atingiu o limite do recurso (para criar/ativar mais um item). */
export async function gateLimit(businessId: string, key: string, currentCount: number, noun = "itens"): Promise<GateResult> {
  const permissions = await getCompanyPermissions(businessId);
  if (!permissions) return { ok: false, error: "Empresa não encontrada.", code: "NOT_FOUND", requiredPlan: null };
  const limit = getLimit(permissions.features, key);
  if (currentCount < limit) return { ok: true, permissions };
  const hint = await upgradeHint(key);
  const error = limit === 0 ? `Este recurso não está incluído no seu plano.${hint.text}` : `Seu plano permite até ${limit} ${noun}.${hint.text}`;
  return { ok: false, error, code: "PLAN_LIMIT", requiredPlan: hint.plan };
}

/** Traduz o erro dos triggers do banco (`PLAN_LIMIT:services`, `PLAN_FEATURE:faq`) para uma mensagem amigável; null se não for desse tipo. */
export function planErrorFromDatabase(message: string | undefined | null): string | null {
  const match = message?.match(/PLAN_(LIMIT|FEATURE):([a-z0-9_]+)/);
  if (!match) return null;
  const label = featureDefinition(match[2])?.label ?? match[2];
  return match[1] === "LIMIT" ? `Limite do plano atingido para: ${label}.` : `Recurso não incluído no plano: ${label}.`;
}

// ---------------------------------------------------------------------------------------------------------------
// Uso atual dos limites
// ---------------------------------------------------------------------------------------------------------------

export type ContentUsage = Partial<Record<FeatureKey, number>>;

/** Itens ATIVOS hoje por recurso contável (inclui o excedente de um downgrade: a empresa vê quanto passa do limite). */
export async function getContentUsage(businessId: string): Promise<ContentUsage> {
  const supabase = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);
  const count = (query: PromiseLike<{ count: number | null }>) => Promise.resolve(query).then((result) => result.count ?? 0);

  const [services, photos, videos, promotions] = await Promise.all([
    count(supabase.from("business_services").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("active", true)),
    count(supabase.from("business_photos").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("active", true).eq("kind", "photo")),
    count(supabase.from("business_photos").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("active", true).eq("kind", "video")),
    count(supabase.from("benefits").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("active", true).or(`valid_until.is.null,valid_until.gte.${today}`)),
  ]);
  return { services, gallery_images: photos, featured_videos: videos, active_promotions: promotions };
}

// ---------------------------------------------------------------------------------------------------------------
// Histórico
// ---------------------------------------------------------------------------------------------------------------

export type PlanHistoryEntry = {
  id: string;
  kind: string;
  fromPlan: PlanKey | null;
  toPlan: PlanKey | null;
  fromStatus: PlanStatus | null;
  toStatus: PlanStatus | null;
  reason: string | null;
  effectiveAt: string;
  changedByType: "admin" | "business" | "system";
  metadata: Record<string, unknown> | null;
};

export async function getPlanHistory(businessId: string, limit = 50): Promise<PlanHistoryEntry[]> {
  const { data } = await createServiceClient()
    .from("plan_change_history")
    .select("id, kind, from_plan, to_plan, from_status, to_status, reason, effective_at, changed_by_type, metadata")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    fromPlan: row.from_plan,
    toPlan: row.to_plan,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    reason: row.reason,
    effectiveAt: row.effective_at,
    changedByType: row.changed_by_type,
    metadata: row.metadata,
  }));
}
