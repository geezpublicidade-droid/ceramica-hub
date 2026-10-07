"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guards";
import { logAdminAction } from "@/lib/audit-log";
import { changeCompanyPlan, previewPlanChange, removeFeatureOverride, revalidatePlanSurfaces, setFeatureOverride } from "@/lib/services/plan-admin";
import { invalidatePlanCatalog, loadPlanCatalog } from "@/lib/services/plan-catalog";
import { getCompanyPermissions } from "@/lib/services/company-plan";
import { FEATURE_KEYS, featureDefinition, type FeatureKey, type FeatureValue } from "@/lib/plans/features";
import { SPONSOR_TOGGLES } from "@/lib/plans/sponsor";
import { PLAN_STATUSES, type BillingCycle, type PlanStatus } from "@/lib/plans/resolve";
import type { FeatureDiff } from "@/lib/plans/resolve";

type Result = { success: true } | { success: false; error: string };
type ValueResult<T> = ({ success: true } & T) | { success: false; error: string };

const fail = (error: string): { success: false; error: string } => ({ success: false, error });

/** Quem mexe em plano de empresa: financeiro, comercial, admin (super_admin sempre passa). */
const PLAN_ROLES = ["admin", "financeiro", "comercial"] as const;
/** Quem edita o catálogo de planos e seus recursos: só admin (super_admin sempre passa). */
const CATALOG_ROLES = ["admin"] as const;

const dateInput = z.string().nullish();

function toIso(value: string | null | undefined): string | null {
  if (!value) return null;
  // <input type="date"> manda AAAA-MM-DD: fim do dia em São Paulo (UTC-3)
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59-03:00` : value;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function refresh(businessId: string) {
  revalidatePath(`/admin/empresas/${businessId}`);
  revalidatePath(`/admin/empresas/${businessId}/plano`);
  revalidatePlanSurfaces();
}

// ---------------------------------------------------------------------------------------------------------------
// Troca de plano (com confirmação)
// ---------------------------------------------------------------------------------------------------------------

export type ChangePlanFormInput = {
  plan: string;
  status: PlanStatus;
  startedAt?: string | null;
  expiresAt?: string | null;
  billingCycle: BillingCycle;
  manualOverride: boolean;
  discountPercent?: number | null;
  reason?: string;
};

/** Passo 1: mostra o que muda (recursos liberados, bloqueados, conteúdo que passa do limite) sem gravar nada. */
export async function adminPreviewPlanChange(businessId: string, newPlan: string): Promise<ValueResult<{ diff: FeatureDiff; fromPlanName: string; toPlanName: string; excessContent: { key: string; label: string; used: number; newLimit: number }[] }>> {
  try {
    await requireAdmin([...PLAN_ROLES]);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Sem permissão.");
  }
  const preview = await previewPlanChange(businessId, newPlan);
  return preview.ok ? { success: true, diff: preview.diff, fromPlanName: preview.fromPlanName, toPlanName: preview.toPlanName, excessContent: preview.excessContent } : fail(preview.error);
}

const changeSchema = z.object({
  plan: z.string().min(2).max(41),
  status: z.enum(PLAN_STATUSES),
  startedAt: dateInput,
  expiresAt: dateInput,
  billingCycle: z.enum(["free", "monthly", "yearly", "courtesy", "custom"]),
  manualOverride: z.boolean(),
  discountPercent: z.number().min(0).max(100).nullish(),
  reason: z.string().trim().max(500).optional(),
});

/** Passo 2: aplica a troca (grava plano, status, datas e desconto; histórico, auditoria e avisos são feitos pelo serviço central). */
export async function adminChangePlan(businessId: string, raw: ChangePlanFormInput): Promise<Result> {
  let adminId: string;
  try {
    adminId = await requireAdmin([...PLAN_ROLES]);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Sem permissão.");
  }
  const parsed = changeSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  const input = parsed.data;

  const result = await changeCompanyPlan({
    businessId,
    plan: input.plan,
    status: input.status,
    startedAt: toIso(input.startedAt),
    expiresAt: toIso(input.expiresAt),
    billingCycle: input.billingCycle,
    manualOverride: input.manualOverride,
    discountPercent: input.discountPercent ?? null,
    reason: input.reason,
    actor: { type: "admin", id: adminId },
  });
  if (!result.ok) return fail(result.error);
  refresh(businessId);
  return { success: true };
}

// ---------------------------------------------------------------------------------------------------------------
// Ações rápidas
// ---------------------------------------------------------------------------------------------------------------

async function quick(businessId: string, change: Parameters<typeof changeCompanyPlan>[0] extends infer T ? Omit<Extract<T, object>, "businessId" | "actor"> : never): Promise<Result> {
  let adminId: string;
  try {
    adminId = await requireAdmin([...PLAN_ROLES]);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Sem permissão.");
  }
  const result = await changeCompanyPlan({ ...change, businessId, actor: { type: "admin", id: adminId } });
  if (!result.ok) return fail(result.error);
  refresh(businessId);
  return { success: true };
}

export async function adminSetPlanStatus(businessId: string, status: PlanStatus, reason?: string): Promise<Result> {
  if (!PLAN_STATUSES.includes(status)) return fail("Status inválido.");
  return quick(businessId, { status, reason: reason?.trim() || undefined });
}

/** Renova: soma dias ao vencimento atual (ou a partir de hoje, se já venceu) e reativa. */
export async function adminRenewPlan(businessId: string, days: number, reason?: string): Promise<Result> {
  if (!Number.isInteger(days) || days < 1 || days > 800) return fail("Informe de 1 a 800 dias.");
  const permissions = await getCompanyPermissions(businessId);
  if (!permissions) return fail("Empresa não encontrada.");
  const base = permissions.expiresAt && new Date(permissions.expiresAt) > new Date() ? new Date(permissions.expiresAt) : new Date();
  const expiresAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
  return quick(businessId, { status: "active", expiresAt, kind: "renewal", reason: reason?.trim() || `Renovado por ${days} dia(s)` });
}

/** Cortesia: concede o plano sem cobrança; ignora vencimento/inadimplência (até a data informada, se houver). */
export async function adminGrantCourtesy(businessId: string, plan: string, untilDate: string | null, reason: string): Promise<Result> {
  if (!reason.trim()) return fail("Informe o motivo da cortesia.");
  const until = toIso(untilDate);
  return quick(businessId, { plan, status: "active", billingCycle: "courtesy", manualOverride: !until, expiresAt: until, kind: "courtesy", reason: reason.trim() });
}

export async function adminSaveDiscount(businessId: string, percent: number | null, reason?: string): Promise<Result> {
  if (percent !== null && (percent < 0 || percent > 100)) return fail("Desconto deve estar entre 0 e 100%.");
  return quick(businessId, { discountPercent: percent, kind: "discount", reason: reason?.trim() || undefined });
}

export async function adminSaveNote(businessId: string, notes: string): Promise<Result> {
  return quick(businessId, { notes: notes.trim() || null, kind: "note", reason: "Observação interna atualizada", silent: true });
}

/** Teste: sobe os recursos de um plano por N dias sem trocar o plano contratado. */
export async function adminStartTrial(businessId: string, plan: string, days: number): Promise<Result> {
  let adminId: string;
  try {
    adminId = await requireAdmin([...PLAN_ROLES]);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Sem permissão.");
  }
  if (!Number.isInteger(days) || days < 1 || days > 90) return fail("O teste vai de 1 a 90 dias.");
  const catalog = await loadPlanCatalog();
  if (!catalog.plans.some((item) => item.key === plan)) return fail("Plano inexistente.");

  const now = new Date();
  const endsAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const supabase = createServiceClient();
  const { error } = await supabase.from("businesses").update({ trial_status: "active", trial_plan: plan, trial_started_at: now.toISOString(), trial_ends_at: endsAt.toISOString() }).eq("id", businessId);
  if (error) return fail("Não foi possível iniciar o teste.");

  await supabase.from("plan_change_history").insert({ business_id: businessId, kind: "trial_start", to_plan: plan, reason: `Teste de ${days} dia(s)`, changed_by_type: "admin", changed_by: adminId, metadata: { endsAt: endsAt.toISOString() } });
  await logAdminAction(adminId, "plan_trial_start", "business", businessId, { plan, days });
  refresh(businessId);
  return { success: true };
}

export async function adminEndTrial(businessId: string): Promise<Result> {
  let adminId: string;
  try {
    adminId = await requireAdmin([...PLAN_ROLES]);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Sem permissão.");
  }
  const supabase = createServiceClient();
  const { error } = await supabase.from("businesses").update({ trial_status: "expired", trial_ends_at: new Date().toISOString() }).eq("id", businessId);
  if (error) return fail("Não foi possível encerrar o teste.");
  await supabase.from("plan_change_history").insert({ business_id: businessId, kind: "trial_end", reason: "Teste encerrado manualmente", changed_by_type: "admin", changed_by: adminId });
  await logAdminAction(adminId, "plan_trial_end", "business", businessId);
  refresh(businessId);
  return { success: true };
}

// ---------------------------------------------------------------------------------------------------------------
// Recursos personalizados (overrides) e patrocinador
// ---------------------------------------------------------------------------------------------------------------

const overrideSchema = z.object({
  featureKey: z.string().min(2).max(60),
  value: z.union([z.boolean(), z.number(), z.string()]),
  startsAt: dateInput,
  expiresAt: dateInput,
  reason: z.string().trim().max(500).optional(),
});

export async function adminSetOverride(businessId: string, raw: z.input<typeof overrideSchema>): Promise<Result> {
  let adminId: string;
  try {
    adminId = await requireAdmin([...PLAN_ROLES]);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Sem permissão.");
  }
  const parsed = overrideSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  const result = await setFeatureOverride({
    businessId,
    featureKey: parsed.data.featureKey,
    value: parsed.data.value,
    startsAt: toIso(parsed.data.startsAt),
    expiresAt: toIso(parsed.data.expiresAt),
    reason: parsed.data.reason,
    actor: { type: "admin", id: adminId },
  });
  if (!result.ok) return fail(result.error);
  refresh(businessId);
  return { success: true };
}

export async function adminRemoveOverride(businessId: string, featureKey: string): Promise<Result> {
  let adminId: string;
  try {
    adminId = await requireAdmin([...PLAN_ROLES]);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Sem permissão.");
  }
  const result = await removeFeatureOverride(businessId, featureKey, { type: "admin", id: adminId });
  if (!result.ok) return fail(result.error);
  refresh(businessId);
  return { success: true };
}

const sponsorSchema = z.object({
  enabled: z.array(z.string()).max(20),
  insertions: z.number().int().min(0).max(100000),
  startsAt: dateInput,
  endsAt: dateInput,
  reason: z.string().trim().max(500).optional(),
});

/** Configuração do patrocinador: marcados viram override ligado (com início/fim e nº de inserções); desmarcados são removidos. */
export async function adminSaveSponsorConfig(businessId: string, raw: z.input<typeof sponsorSchema>): Promise<Result> {
  let adminId: string;
  try {
    adminId = await requireAdmin([...PLAN_ROLES]);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Sem permissão.");
  }
  const parsed = sponsorSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  const { enabled, insertions, startsAt, endsAt, reason } = parsed.data;
  const starts = toIso(startsAt);
  const ends = toIso(endsAt);
  if (starts && ends && new Date(ends) <= new Date(starts)) return fail("A data de término precisa ser depois da de início.");

  const actor = { type: "admin" as const, id: adminId };
  for (const key of SPONSOR_TOGGLES) {
    const result = enabled.includes(key)
      ? await setFeatureOverride({ businessId, featureKey: key, value: true, startsAt: starts, expiresAt: ends, reason, actor })
      : await removeFeatureOverride(businessId, key, actor);
    if (!result.ok && enabled.includes(key)) return fail(result.error);
  }
  const insertionResult = insertions > 0
    ? await setFeatureOverride({ businessId, featureKey: "insertions_count", value: insertions, startsAt: starts, expiresAt: ends, reason, actor })
    : await removeFeatureOverride(businessId, "insertions_count", actor);
  if (!insertionResult.ok && insertions > 0) return fail(insertionResult.error);

  refresh(businessId);
  return { success: true };
}

// ---------------------------------------------------------------------------------------------------------------
// Perfil sem proprietário e entregas do plano
// ---------------------------------------------------------------------------------------------------------------

export async function adminSetOwnerValidated(businessId: string, validated: boolean): Promise<Result> {
  let adminId: string;
  try {
    adminId = await requireAdmin([...PLAN_ROLES]);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Sem permissão.");
  }
  const { error } = await createServiceClient().from("businesses").update({ owner_validated: validated }).eq("id", businessId);
  if (error) return fail("Não foi possível salvar.");
  await logAdminAction(adminId, validated ? "owner_validated" : "owner_unvalidated", "business", businessId);
  refresh(businessId);
  return { success: true };
}

const deliverableSchema = z.object({
  kind: z.enum(["tour3d_production", "networking_event", "networking_meal", "marketing_action", "institutional_content", "special_action"]),
  title: z.string().trim().min(2, "Informe o título.").max(160),
  scheduledFor: dateInput,
  notes: z.string().trim().max(800).optional(),
});

export async function adminAddDeliverable(businessId: string, raw: z.input<typeof deliverableSchema>): Promise<Result> {
  let adminId: string;
  try {
    adminId = await requireAdmin([...PLAN_ROLES]);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Sem permissão.");
  }
  const parsed = deliverableSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  const { error } = await createServiceClient().from("company_plan_deliverables").insert({
    business_id: businessId,
    kind: parsed.data.kind,
    title: parsed.data.title,
    scheduled_for: parsed.data.scheduledFor || null,
    status: parsed.data.scheduledFor ? "scheduled" : "planned",
    notes: parsed.data.notes || null,
    created_by: adminId,
  });
  if (error) return fail("Não foi possível salvar a entrega.");
  refresh(businessId);
  return { success: true };
}

export async function adminSetDeliverableStatus(businessId: string, deliverableId: string, status: "planned" | "scheduled" | "delivered" | "canceled"): Promise<Result> {
  try {
    await requireAdmin([...PLAN_ROLES]);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Sem permissão.");
  }
  const { error } = await createServiceClient()
    .from("company_plan_deliverables")
    .update({ status, delivered_at: status === "delivered" ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
    .eq("id", deliverableId)
    .eq("business_id", businessId);
  if (error) return fail("Não foi possível atualizar.");
  refresh(businessId);
  return { success: true };
}

// ---------------------------------------------------------------------------------------------------------------
// Catálogo de planos (criar plano novo, editar recursos, tolerância)
// ---------------------------------------------------------------------------------------------------------------

function validFeatureValue(key: FeatureKey, value: unknown): value is FeatureValue {
  const def = featureDefinition(key);
  if (!def) return false;
  if (def.kind === "flag") return typeof value === "boolean";
  if (def.kind === "limit") return value === "unlimited" || (typeof value === "number" && Number.isFinite(value) && value >= 0);
  return typeof value === "string" && (def.options ?? []).includes(value);
}

/** Salva os recursos de um plano (vale para todas as empresas do plano na hora). */
export async function adminSavePlanFeatures(planKey: string, values: Record<string, FeatureValue>): Promise<Result> {
  let adminId: string;
  try {
    adminId = await requireAdmin([...CATALOG_ROLES]);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Sem permissão.");
  }
  const rows: { plan_key: string; feature_key: string; value: FeatureValue; updated_at: string }[] = [];
  for (const key of FEATURE_KEYS) {
    if (!(key in values)) continue;
    if (!validFeatureValue(key, values[key])) return fail(`Valor inválido para “${featureDefinition(key)?.label ?? key}”.`);
    rows.push({ plan_key: planKey, feature_key: key, value: values[key], updated_at: new Date().toISOString() });
  }
  const { error } = await createServiceClient().from("plan_features").upsert(rows, { onConflict: "plan_key,feature_key" });
  if (error) return fail("Não foi possível salvar os recursos.");
  await logAdminAction(adminId, "plan_features_save", "plan", planKey, { changed: rows.length });
  invalidatePlanCatalog();
  revalidatePath("/admin/planos");
  revalidatePlanSurfaces();
  return { success: true };
}

const newPlanSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]{1,40}$/, "Use letras minúsculas, números e _ (ex.: plano_anual)."),
  name: z.string().trim().min(2, "Informe o nome.").max(60),
  description: z.string().trim().max(300).optional(),
  rank: z.number().int().min(0).max(1000),
  copyFrom: z.string().min(2).max(41),
  monthlyPriceCents: z.number().int().min(0).max(100_000_000).nullish(),
});

/** Cria um plano novo copiando os recursos de outro; já fica disponível para atribuir a empresas (preço também vira produto). */
export async function adminCreatePlan(raw: z.input<typeof newPlanSchema>): Promise<Result> {
  let adminId: string;
  try {
    adminId = await requireAdmin([...CATALOG_ROLES]);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Sem permissão.");
  }
  const parsed = newPlanSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  const input = parsed.data;

  const catalog = await loadPlanCatalog({ fresh: true });
  if (catalog.plans.some((plan) => plan.key === input.key)) return fail("Já existe um plano com essa chave.");
  const source = catalog.features[input.copyFrom];
  if (!source) return fail("Plano de origem inexistente.");

  const supabase = createServiceClient();
  const { error } = await supabase.from("plans").insert({ key: input.key, name: input.name, description: input.description ?? null, rank: input.rank, is_system: false, billing_type: input.monthlyPriceCents ? "mensal" : "personalizado" });
  if (error) return fail("Não foi possível criar o plano.");
  await supabase.from("plan_features").insert(FEATURE_KEYS.map((key) => ({ plan_key: input.key, feature_key: key, value: source[key] })));
  await supabase.from("products").insert({
    slug: `plano-${input.key.replace(/_/g, "-")}`,
    name: input.name,
    category: "plano",
    billing_type: input.monthlyPriceCents ? "mensal" : "personalizado",
    monthly_price_cents: input.monthlyPriceCents ?? null,
    plan_key: input.key,
    sort_order: 100 + input.rank,
    description: input.description ?? null,
    limits: {},
  });
  await logAdminAction(adminId, "plan_create", "plan", input.key, { copyFrom: input.copyFrom });
  invalidatePlanCatalog();
  revalidatePath("/admin/planos");
  return { success: true };
}

const planMetaSchema = z.object({ name: z.string().trim().min(2).max(60), description: z.string().trim().max(300), rank: z.number().int().min(0).max(1000), active: z.boolean(), isPublic: z.boolean() });

export async function adminUpdatePlan(planKey: string, raw: z.input<typeof planMetaSchema>): Promise<Result> {
  let adminId: string;
  try {
    adminId = await requireAdmin([...CATALOG_ROLES]);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Sem permissão.");
  }
  const parsed = planMetaSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  const { error } = await createServiceClient()
    .from("plans")
    .update({ name: parsed.data.name, description: parsed.data.description, rank: parsed.data.rank, active: parsed.data.active, is_public: parsed.data.isPublic, updated_at: new Date().toISOString() })
    .eq("key", planKey);
  if (error) return fail("Não foi possível salvar o plano.");
  await logAdminAction(adminId, "plan_update", "plan", planKey, parsed.data);
  invalidatePlanCatalog();
  revalidatePath("/admin/planos");
  revalidatePlanSurfaces();
  return { success: true };
}

export async function adminSaveGraceDays(days: number): Promise<Result> {
  let adminId: string;
  try {
    adminId = await requireAdmin([...CATALOG_ROLES]);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Sem permissão.");
  }
  if (!Number.isInteger(days) || days < 0 || days > 90) return fail("A tolerância vai de 0 a 90 dias.");
  const { error } = await createServiceClient().from("platform_settings").update({ plan_grace_days: days }).eq("id", true);
  if (error) return fail("Não foi possível salvar.");
  await logAdminAction(adminId, "plan_grace_days", "settings", null, { days });
  invalidatePlanCatalog();
  revalidatePath("/admin/planos");
  return { success: true };
}
