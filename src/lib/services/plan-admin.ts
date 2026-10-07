import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { logAdminAction, logSystemAction } from "@/lib/audit-log";
import { sendEmail } from "@/lib/services/email";
import { loadPlanCatalog, planNameFrom } from "@/lib/services/plan-catalog";
import { getCompanyPermissions, getContentUsage } from "@/lib/services/company-plan";
import { computeUsage, diffFeatures, formatFeatureValue, PLAN_STATUSES, resolveFeatures, type BillingCycle, type FeatureDiff, type PlanStatus } from "@/lib/plans/resolve";
import { featureDefinition, normalizeFeatureKey, type FeatureValue, type PlanKey } from "@/lib/plans/features";

export type PlanActor = { type: "admin"; id: string } | { type: "business"; id: string } | { type: "system"; id?: undefined };

export type HistoryKind =
  | "upgrade"
  | "downgrade"
  | "plan_change"
  | "renewal"
  | "payment"
  | "trial_start"
  | "trial_end"
  | "suspend"
  | "reactivate"
  | "cancel"
  | "courtesy"
  | "override_set"
  | "override_removed"
  | "status_change"
  | "auto_downgrade"
  | "auto_expire"
  | "dates_change"
  | "discount"
  | "note";

export type PlanChangeInput = {
  businessId: string;
  plan?: PlanKey;
  status?: PlanStatus;
  startedAt?: string | null;
  expiresAt?: string | null;
  billingCycle?: BillingCycle;
  manualOverride?: boolean;
  discountPercent?: number | null;
  notes?: string | null;
  reason?: string;
  /** força o tipo no histórico (ex.: "payment"); senão é deduzido */
  kind?: HistoryKind;
  actor: PlanActor;
  /** não envia e-mail (usado por rotinas em lote) */
  silent?: boolean;
};

export type PlanChangeResult = { ok: true; kind: HistoryKind; diff: FeatureDiff; fromPlan: PlanKey; toPlan: PlanKey } | { ok: false; error: string };

const BILLING_CYCLES: BillingCycle[] = ["free", "monthly", "yearly", "courtesy", "custom"];

/** Páginas que dependem do plano: atualizam sozinhas depois de qualquer alteração. */
export function revalidatePlanSurfaces(): void {
  for (const path of ["/[locale]/empresa/[slug]", "/[locale]/empresas", "/[locale]/categoria/[...path]", "/[locale]"]) revalidatePath(path, path.endsWith("]") ? "page" : "layout");
  revalidatePath("/dashboard", "layout");
}

async function recordHistory(entry: {
  businessId: string;
  kind: HistoryKind;
  fromPlan: PlanKey | null;
  toPlan: PlanKey | null;
  fromStatus: PlanStatus | null;
  toStatus: PlanStatus | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
  actor: PlanActor;
}): Promise<void> {
  await createServiceClient().from("plan_change_history").insert({
    business_id: entry.businessId,
    kind: entry.kind,
    from_plan: entry.fromPlan,
    to_plan: entry.toPlan,
    from_status: entry.fromStatus,
    to_status: entry.toStatus,
    reason: entry.reason ?? null,
    metadata: entry.metadata ?? null,
    changed_by_type: entry.actor.type,
    changed_by: entry.actor.id ?? null,
  });
}

function deduceKind(fromPlan: PlanKey, toPlan: PlanKey, fromStatus: PlanStatus, toStatus: PlanStatus, ranks: Record<PlanKey, number>, hadExpiryChange: boolean): HistoryKind {
  if (fromPlan !== toPlan) return (ranks[toPlan] ?? 0) > (ranks[fromPlan] ?? 0) ? "upgrade" : (ranks[toPlan] ?? 0) < (ranks[fromPlan] ?? 0) ? "downgrade" : "plan_change";
  if (fromStatus !== toStatus) {
    if (toStatus === "suspended") return "suspend";
    if (toStatus === "canceled") return "cancel";
    if (toStatus === "active" && ["suspended", "canceled", "expired", "past_due", "pending"].includes(fromStatus)) return "reactivate";
    if (toStatus === "trialing") return "trial_start";
    return "status_change";
  }
  return hadExpiryChange ? "renewal" : "dates_change";
}

function validate(input: PlanChangeInput, knownPlans: Set<string>): string | null {
  if (input.plan !== undefined && !knownPlans.has(input.plan)) return "Plano inexistente.";
  if (input.status !== undefined && !PLAN_STATUSES.includes(input.status)) return "Status inválido.";
  if (input.billingCycle !== undefined && !BILLING_CYCLES.includes(input.billingCycle)) return "Ciclo de cobrança inválido.";
  if (input.discountPercent != null && (input.discountPercent < 0 || input.discountPercent > 100)) return "Desconto deve estar entre 0 e 100%.";
  const start = input.startedAt ? new Date(input.startedAt).getTime() : null;
  const end = input.expiresAt ? new Date(input.expiresAt).getTime() : null;
  if ((input.startedAt && Number.isNaN(start)) || (input.expiresAt && Number.isNaN(end))) return "Data inválida.";
  if (start !== null && end !== null && end <= start) return "O vencimento precisa ser depois do início.";
  return null;
}

/**
 * ÚNICA porta de escrita para alterar o plano de uma empresa (admin, pagamento aprovado ou rotina automática).
 * Grava o novo estado, registra no histórico com a diferença de recursos, audita e avisa empresa e administradores.
 * Nenhum conteúdo da empresa é apagado: o que excede o novo plano só deixa de ser publicado (ver publishedItems).
 */
export async function changeCompanyPlan(input: PlanChangeInput): Promise<PlanChangeResult> {
  const catalog = await loadPlanCatalog();
  const current = await getCompanyPermissions(input.businessId);
  if (!current) return { ok: false, error: "Empresa não encontrada." };

  const error = validate(input, new Set(catalog.plans.map((plan) => plan.key)));
  if (error) return { ok: false, error };

  const toPlan = input.plan ?? current.contractedPlan;
  const toStatus = input.status ?? current.status;
  const update: Record<string, unknown> = { plan: toPlan, plan_status: toStatus, plan_updated_at: new Date().toISOString() };
  if (input.startedAt !== undefined) update.plan_started_at = input.startedAt;
  if (input.expiresAt !== undefined) update.plan_expires_at = input.expiresAt;
  if (input.billingCycle !== undefined) update.billing_cycle = input.billingCycle;
  if (input.manualOverride !== undefined) update.manual_override = input.manualOverride;
  if (input.discountPercent !== undefined) update.plan_discount_percent = input.discountPercent;
  if (input.notes !== undefined) update.plan_notes = input.notes;
  if (toPlan !== current.contractedPlan && input.startedAt === undefined && !current.startedAt) update.plan_started_at = new Date().toISOString();

  const supabase = createServiceClient();
  const { error: updateError } = await supabase.from("businesses").update(update).eq("id", input.businessId);
  if (updateError) return { ok: false, error: "Não foi possível salvar o plano." };

  const after = await getCompanyPermissions(input.businessId);
  const diff = diffFeatures(current.features, after?.features ?? current.features);
  const kind = input.kind ?? deduceKind(current.contractedPlan, toPlan, current.status, toStatus, catalog.ranks, input.expiresAt !== undefined && input.expiresAt !== current.expiresAt);

  await recordHistory({
    businessId: input.businessId,
    kind,
    fromPlan: current.contractedPlan,
    toPlan,
    fromStatus: current.status,
    toStatus,
    reason: input.reason,
    metadata: {
      effectiveBefore: current.plan,
      effectiveAfter: after?.plan,
      expiresAt: update.plan_expires_at ?? current.expiresAt,
      manualOverride: update.manual_override ?? current.manualOverride,
      gained: diff.gained.map((change) => change.key),
      lost: diff.lost.map((change) => change.key),
    },
    actor: input.actor,
  });

  if (input.actor.type === "admin") await logAdminAction(input.actor.id, `plan_${kind}`, "business", input.businessId, { from: current.contractedPlan, to: toPlan, status: toStatus, reason: input.reason ?? null });
  else await logSystemAction(`plan_${kind}`, "business", input.businessId, { from: current.contractedPlan, to: toPlan, status: toStatus });

  revalidatePlanSurfaces();
  if (!input.silent) await notifyPlanChange({ businessId: input.businessId, kind, fromPlanName: planNameFrom(catalog, current.plan), toPlanName: after?.planName ?? planNameFrom(catalog, toPlan), diff, reason: input.reason });
  return { ok: true, kind, diff, fromPlan: current.contractedPlan, toPlan };
}

// ---------------------------------------------------------------------------------------------------------------
// Overrides de recursos (cortesia de recurso, patrocinador, liberação temporária)
// ---------------------------------------------------------------------------------------------------------------

export type OverrideInput = { businessId: string; featureKey: string; value: FeatureValue; expiresAt?: string | null; startsAt?: string | null; reason?: string; actor: PlanActor };

function validOverrideValue(key: string, value: FeatureValue): boolean {
  const def = featureDefinition(key);
  if (!def) return false;
  if (def.kind === "flag") return typeof value === "boolean";
  if (def.kind === "limit") return value === "unlimited" || (typeof value === "number" && Number.isFinite(value) && value >= 0);
  return typeof value === "string" && (def.options ?? []).includes(value);
}

export async function setFeatureOverride(input: OverrideInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = normalizeFeatureKey(input.featureKey);
  if (!key) return { ok: false, error: "Recurso inexistente." };
  if (!validOverrideValue(key, input.value)) return { ok: false, error: "Valor inválido para este recurso." };
  if (input.expiresAt && input.startsAt && new Date(input.expiresAt) <= new Date(input.startsAt)) return { ok: false, error: "O fim precisa ser depois do início." };

  const current = await getCompanyPermissions(input.businessId);
  if (!current) return { ok: false, error: "Empresa não encontrada." };

  const { error } = await createServiceClient()
    .from("company_feature_overrides")
    .upsert(
      { business_id: input.businessId, feature_key: key, value: input.value, reason: input.reason ?? null, starts_at: input.startsAt ?? null, expires_at: input.expiresAt ?? null, created_by: input.actor.id ?? null },
      { onConflict: "business_id,feature_key" },
    );
  if (error) return { ok: false, error: "Não foi possível salvar o recurso personalizado." };

  await recordHistory({
    businessId: input.businessId,
    kind: "override_set",
    fromPlan: current.contractedPlan,
    toPlan: current.contractedPlan,
    fromStatus: current.status,
    toStatus: current.status,
    reason: input.reason,
    metadata: { feature: key, value: formatFeatureValue(key, input.value), expiresAt: input.expiresAt ?? null },
    actor: input.actor,
  });
  if (input.actor.type === "admin") await logAdminAction(input.actor.id, "plan_override_set", "business", input.businessId, { feature: key, value: input.value });
  revalidatePlanSurfaces();
  return { ok: true };
}

export async function removeFeatureOverride(businessId: string, featureKey: string, actor: PlanActor): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = normalizeFeatureKey(featureKey);
  if (!key) return { ok: false, error: "Recurso inexistente." };
  const current = await getCompanyPermissions(businessId);
  if (!current) return { ok: false, error: "Empresa não encontrada." };

  const { error } = await createServiceClient().from("company_feature_overrides").delete().eq("business_id", businessId).eq("feature_key", key);
  if (error) return { ok: false, error: "Não foi possível remover." };
  await recordHistory({ businessId, kind: "override_removed", fromPlan: current.contractedPlan, toPlan: current.contractedPlan, fromStatus: current.status, toStatus: current.status, metadata: { feature: key }, actor });
  if (actor.type === "admin") await logAdminAction(actor.id, "plan_override_removed", "business", businessId, { feature: key });
  revalidatePlanSurfaces();
  return { ok: true };
}

/** O que mudaria ao trocar de plano (tela de confirmação do admin): recursos liberados, bloqueados e alterados. */
export async function previewPlanChange(businessId: string, newPlan: PlanKey): Promise<{ ok: true; diff: FeatureDiff; fromPlanName: string; toPlanName: string; excessContent: { key: string; label: string; used: number; newLimit: number }[] } | { ok: false; error: string }> {
  const [catalog, current] = await Promise.all([loadPlanCatalog(), getCompanyPermissions(businessId)]);
  if (!current) return { ok: false, error: "Empresa não encontrada." };
  const target = catalog.features[newPlan];
  if (!target) return { ok: false, error: "Plano inexistente." };

  const next = resolveFeatures(target, newPlan, current.overrides);
  const usage = computeUsage(next, await getContentUsage(businessId)).filter((row) => row.over);
  return {
    ok: true,
    diff: diffFeatures(current.features, next),
    fromPlanName: current.planName,
    toPlanName: planNameFrom(catalog, newPlan),
    excessContent: usage.map((row) => ({ key: row.key, label: row.label, used: row.used, newLimit: row.limit })),
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Notificações
// ---------------------------------------------------------------------------------------------------------------

const KIND_LABEL: Partial<Record<HistoryKind, string>> = {
  upgrade: "Upgrade de plano",
  downgrade: "Alteração para plano inferior",
  plan_change: "Alteração de plano",
  renewal: "Renovação do plano",
  payment: "Pagamento confirmado",
  suspend: "Plano suspenso",
  cancel: "Plano cancelado",
  reactivate: "Plano reativado",
  courtesy: "Cortesia concedida",
  auto_downgrade: "Plano expirado",
  auto_expire: "Plano expirado",
  trial_start: "Período de teste iniciado",
};

async function notifyPlanChange(input: { businessId: string; kind: HistoryKind; fromPlanName: string; toPlanName: string; diff: FeatureDiff; reason?: string }): Promise<void> {
  const label = KIND_LABEL[input.kind];
  if (!label) return;
  try {
    const supabase = createServiceClient();
    const [{ data: business }, { data: admins }] = await Promise.all([
      supabase.from("businesses").select("name, email").eq("id", input.businessId).maybeSingle(),
      supabase.from("admins").select("email").in("role", ["super_admin", "admin", "financeiro"]),
    ]);
    if (!business) return;
    const gained = input.diff.gained.slice(0, 8).map((change) => `<li>${featureDefinition(change.key)?.label ?? change.key}</li>`).join("");
    const lost = input.diff.lost.slice(0, 8).map((change) => `<li>${featureDefinition(change.key)?.label ?? change.key}</li>`).join("");
    const body = `<p>${label}: <strong>${input.fromPlanName}</strong> → <strong>${input.toPlanName}</strong>.</p>${gained ? `<p>Liberado:</p><ul>${gained}</ul>` : ""}${lost ? `<p>Deixa de valer:</p><ul>${lost}</ul><p>Seu conteúdo continua salvo e volta a ser publicado se o plano for retomado.</p>` : ""}${input.reason ? `<p>Observação: ${input.reason}</p>` : ""}`;

    if (business.email) await sendEmail({ to: business.email, subject: `${label} — Cerâmica Hub`, html: `<p>Olá, ${business.name}!</p>${body}` });
    for (const admin of admins ?? []) if (admin.email) await sendEmail({ to: admin.email, subject: `[Planos] ${label}: ${business.name}`, html: body });
  } catch (error) {
    console.error("[plans] falha ao notificar alteração de plano:", error);
  }
}
