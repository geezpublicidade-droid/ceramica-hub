import { createServiceClient } from "@/lib/supabase/server";
import { PAYMENT_STATUSES_THAT_RELEASE, todaySaoPaulo } from "@/lib/placement-rules";
import { logSystemAction } from "@/lib/audit-log";
import { formatDateBR } from "@/lib/utils";
import type { TaskPriority } from "@/lib/services/tasks";
import type { OperationalRule } from "./catalog";
import { changeCompanyPlan } from "@/lib/services/plan-admin";
import { loadPlanCatalog } from "@/lib/services/plan-catalog";
import { resolveEffectivePlan } from "@/lib/plans/resolve";

type Supabase = ReturnType<typeof createServiceClient>;

const DAY_MS = 24 * 60 * 60 * 1000;
const OPEN_PROPOSAL_STATUSES = ["enviada", "visualizada", "negociacao"];
const FREE_PLAN = "presenca";

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY_MS);

type AutoTask = {
  rule: OperationalRule;
  entityType: string;
  entityId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  dueAt?: string | null;
  ownerAdminId?: string | null;
};

/** Uma tarefa por (regra, entidade): o índice único ignora repetição, então rodar de novo não duplica nem reabre tarefa concluída. */
async function createAutoTasks(supabase: Supabase, tasks: AutoTask[]): Promise<number> {
  if (tasks.length === 0) return 0;
  const rows = tasks.map((task) => ({
    title: task.title,
    description: task.description ?? null,
    priority: task.priority,
    due_at: task.dueAt ?? null,
    owner_admin_id: task.ownerAdminId ?? null,
    entity_type: task.entityType,
    entity_id: task.entityId,
    auto_rule: task.rule,
  }));
  const { data, error } = await supabase
    .from("tasks")
    .upsert(rows, { onConflict: "auto_rule,entity_id", ignoreDuplicates: true })
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

export async function leadFollowupRule(supabase: Supabase): Promise<number> {
  const { data, error } = await supabase
    .from("leads")
    .select("id, contact_name, company_name, owner_admin_id, created_at")
    .eq("stage", "novo")
    .gte("created_at", daysFromNow(-14).toISOString());
  if (error) throw error;
  return createAutoTasks(
    supabase,
    (data ?? []).map((lead) => ({
      rule: "lead_followup",
      entityType: "lead",
      entityId: lead.id,
      title: `Fazer o primeiro contato com ${lead.contact_name}${lead.company_name ? ` (${lead.company_name})` : ""}`,
      priority: "alta",
      dueAt: new Date(new Date(lead.created_at).getTime() + DAY_MS).toISOString(),
      ownerAdminId: lead.owner_admin_id,
    }))
  );
}

export async function proposalExpiringRule(supabase: Supabase): Promise<number> {
  const { data, error } = await supabase
    .from("proposals")
    .select("id, number, client_name, valid_until")
    .in("status", OPEN_PROPOSAL_STATUSES)
    .gte("valid_until", isoDate(new Date()))
    .lte("valid_until", isoDate(daysFromNow(3)));
  if (error) throw error;
  return createAutoTasks(
    supabase,
    (data ?? []).map((proposal) => ({
      rule: "proposal_expiring",
      entityType: "proposal",
      entityId: proposal.id,
      title: `Proposta #${proposal.number} de ${proposal.client_name} vence em ${formatDateBR(proposal.valid_until)}`,
      description: "Entre em contato para fechar ou renovar a validade antes que ela vença.",
      priority: "alta",
      dueAt: new Date(`${proposal.valid_until}T12:00:00Z`).toISOString(),
    }))
  );
}

export async function proposalExpiredRule(supabase: Supabase): Promise<number> {
  const { data, error } = await supabase
    .from("proposals")
    .update({ status: "vencida" })
    .in("status", OPEN_PROPOSAL_STATUSES)
    .lt("valid_until", isoDate(new Date()))
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

export async function overduePaymentRule(supabase: Supabase): Promise<number> {
  const { data, error } = await supabase.from("subscriptions").select("id, businesses(name)").eq("status", "past_due");
  if (error) throw error;
  return createAutoTasks(
    supabase,
    (data ?? []).map((sub) => ({
      rule: "overdue_payment",
      entityType: "subscription",
      entityId: sub.id,
      title: `Cobrar pagamento atrasado de ${(sub.businesses as unknown as { name: string } | null)?.name ?? "empresa"}`,
      priority: "urgente",
    }))
  );
}

export async function inactiveBusinessRule(supabase: Supabase): Promise<number> {
  const { data: ids, error } = await supabase.rpc("inactive_business_ids", { p_days: 30 });
  if (error) throw error;
  const idList = (ids ?? []) as string[];
  if (idList.length === 0) return 0;
  const { data: businesses, error: namesError } = await supabase.from("businesses").select("id, name").in("id", idList);
  if (namesError) throw namesError;
  return createAutoTasks(
    supabase,
    (businesses ?? []).map((business) => ({
      rule: "inactive_business",
      entityType: "business",
      entityId: business.id,
      title: `${business.name} está sem visitas há 30 dias`,
      description: "Sugerir divulgação, atualização do perfil ou campanha para reativar a empresa.",
      priority: "media",
    }))
  );
}

/**
 * Assinatura vencida: marca a empresa como "em atraso" (past_due). O plano CONTRATADO não é reescrito: durante a tolerância
 * os recursos continuam, e depois dela o plano em vigor volta ao gratuito sozinho. Todo o conteúdo pago fica salvo (inativo)
 * e é restaurado na regularização. Cortesia (manual_override) nunca vence sozinha.
 */
async function markPastDueIfNoActiveSubscription(supabase: Supabase, businessId: string, expiredPlan: string): Promise<boolean> {
  const { count, error } = await supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("status", "active");
  if (error) throw error;
  if ((count ?? 0) > 0) return false;

  const { data: business, error: readError } = await supabase.from("businesses").select("plan, plan_status, manual_override").eq("id", businessId).maybeSingle();
  if (readError) throw readError;
  if (!business || business.plan !== expiredPlan || business.manual_override || ["past_due", "expired", "suspended", "canceled"].includes(business.plan_status)) return false;

  const result = await changeCompanyPlan({ businessId, status: "past_due", kind: "status_change", reason: "Assinatura venceu sem renovação", actor: { type: "system" } });
  return result.ok;
}

export async function subscriptionExpiredRule(supabase: Supabase): Promise<number> {
  const { data, error } = await supabase
    .from("subscriptions")
    .update({ status: "expired" })
    .eq("status", "active")
    .lt("ends_at", new Date().toISOString())
    .select("id, business_id, plan");
  if (error) throw error;
  const expired = data ?? [];
  for (const sub of expired) await markPastDueIfNoActiveSubscription(supabase, sub.business_id, sub.plan);
  return expired.length;
}

/**
 * Tolerância esgotada: empresa em atraso (ou ativa com vencimento passado) cujo plano em vigor já voltou ao gratuito passa a
 * "expirada" e isso é registrado no histórico. É só o registro: o conteúdo continua salvo e a regularização restaura tudo.
 */
export async function planGraceExpiredRule(supabase: Supabase): Promise<number> {
  const catalog = await loadPlanCatalog({ fresh: true });
  const { data, error } = await supabase
    .from("businesses")
    .select("id, plan, plan_status, plan_expires_at, plan_updated_at, plan_started_at, manual_override")
    .in("plan_status", ["active", "trialing", "past_due"])
    .neq("plan", FREE_PLAN)
    .eq("manual_override", false);
  if (error) throw error;

  let count = 0;
  for (const row of data ?? []) {
    const effective = resolveEffectivePlan(
      { plan: row.plan, status: row.plan_status, startedAt: row.plan_started_at, expiresAt: row.plan_expires_at, updatedAt: row.plan_updated_at, manualOverride: false },
      { graceDays: catalog.graceDays, ranks: catalog.ranks },
    );
    if (!effective.downgraded || effective.reason !== "free_expired") continue;
    const result = await changeCompanyPlan({ businessId: row.id, status: "expired", kind: "auto_downgrade", reason: `Tolerância de ${catalog.graceDays} dia(s) esgotada: a página voltou aos recursos gratuitos`, actor: { type: "system" } });
    if (result.ok) count += 1;
  }
  return count;
}

export async function placementReleaseRule(supabase: Supabase): Promise<number> {
  const today = todaySaoPaulo();
  const { data, error } = await supabase
    .from("category_placements")
    .update({ status: "active" })
    .eq("status", "reserved")
    .in("payment_status", [...PAYMENT_STATUSES_THAT_RELEASE])
    .lte("starts_at", today)
    .gte("ends_at", today)
    .select("id");
  if (error) throw error;
  for (const row of data ?? []) await logSystemAction("placement_released", "category_placement", row.id);
  return data?.length ?? 0;
}

export async function placementExpiredRule(supabase: Supabase): Promise<number> {
  const { data, error } = await supabase
    .from("category_placements")
    .update({ status: "expired" })
    .in("status", ["reserved", "active", "paused"])
    .lt("ends_at", todaySaoPaulo())
    .select("id");
  if (error) throw error;
  for (const row of data ?? []) await logSystemAction("placement_expired", "category_placement", row.id);
  return data?.length ?? 0;
}
