import { createServiceClient } from "@/lib/supabase/server";
import { logSystemAction } from "@/lib/audit-log";
import { formatDateBR } from "@/lib/utils";
import type { TaskPriority } from "@/lib/services/tasks";
import type { OperationalRule } from "./catalog";

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

/** Rebaixa a empresa ao plano gratuito só se o plano dela é o da assinatura que venceu e não resta outra ativa. */
async function downgradeIfNoActiveSubscription(supabase: Supabase, businessId: string, expiredPlan: string): Promise<boolean> {
  const { count, error } = await supabase
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("status", "active");
  if (error) throw error;
  if ((count ?? 0) > 0) return false;

  const { data, error: updateError } = await supabase
    .from("businesses")
    .update({ plan: FREE_PLAN })
    .eq("id", businessId)
    .eq("plan", expiredPlan)
    .select("id");
  if (updateError) throw updateError;
  if (!data?.length) return false;
  await logSystemAction("subscription_expired_downgrade", "business", businessId, { from: expiredPlan, to: FREE_PLAN });
  return true;
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
  for (const sub of expired) await downgradeIfNoActiveSubscription(supabase, sub.business_id, sub.plan);
  return expired.length;
}
