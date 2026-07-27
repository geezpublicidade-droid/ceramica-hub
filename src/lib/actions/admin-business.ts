"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guards";
import { logAdminAction } from "@/lib/audit-log";

/** Monta os campos de trial se a configuração global permitir -- null quando
 * o trial está desligado (usado tanto na aprovação automática quanto na
 * liberação manual pelo admin, pra não duplicar a mesma regra duas vezes). */
async function buildTrialUpdate(supabase: ReturnType<typeof createServiceClient>): Promise<Record<string, unknown> | null> {
  const { data: settings } = await supabase
    .from("platform_settings")
    .select("trial_enabled, trial_plan, trial_duration_days")
    .single();
  if (!settings?.trial_enabled) return null;

  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + settings.trial_duration_days * 24 * 60 * 60 * 1000);
  return {
    trial_status: "active",
    trial_plan: settings.trial_plan,
    trial_started_at: startedAt.toISOString(),
    trial_ends_at: endsAt.toISOString(),
  };
}

export async function approveBusiness(businessId: string) {
  const adminId = await requireAdmin(["super_admin", "admin", "moderador"]);
  const supabase = createServiceClient();

  const { data: business, error: fetchError } = await supabase
    .from("businesses")
    .select("plan")
    .eq("id", businessId)
    .single();
  if (fetchError) throw fetchError;

  const update: Record<string, unknown> = { status: "approved", rejection_reason: null };

  // trial de 14 dias do plano Destaque, só pra quem entra pelo gratuito
  if (business.plan === "presenca") {
    const trialUpdate = await buildTrialUpdate(supabase);
    if (trialUpdate) Object.assign(update, trialUpdate);
  }

  const { error } = await supabase.from("businesses").update(update).eq("id", businessId);
  if (error) throw error;

  await logAdminAction(adminId, "approve_business", "business", businessId, {
    trialGranted: Boolean(update.trial_status),
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

/** Selo "Empresa Fundadora" -- controlado manualmente pelo admin (ver
 * Seção 16 do plano: "sem criar escassez falsa", então não há contador de
 * vagas automático aqui, só o selo em si). */
export async function setBusinessFounder(businessId: string, founder: boolean) {
  const adminId = await requireAdmin(["super_admin", "admin"]);
  const supabase = createServiceClient();
  const { error } = await supabase.from("businesses").update({ founder }).eq("id", businessId);
  if (error) throw error;

  await logAdminAction(adminId, "set_business_founder", "business", businessId, { founder });

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/preview");
}

/** Libera manualmente o trial pra uma empresa já aprovada -- hoje só era
 * concedido automaticamente no momento da aprovação (ver approveBusiness).
 * Não sobrescreve trial já ativo. */
export async function grantTrial(businessId: string): Promise<{ success: true } | { success: false; error: string }> {
  const adminId = await requireAdmin(["super_admin", "admin"]);
  const supabase = createServiceClient();

  const { data: business, error: fetchError } = await supabase
    .from("businesses")
    .select("plan, trial_status")
    .eq("id", businessId)
    .single();
  if (fetchError || !business) return { success: false, error: "Empresa não encontrada." };
  if (business.trial_status === "active") return { success: false, error: "Essa empresa já está em trial." };

  const trialUpdate = await buildTrialUpdate(supabase);
  if (!trialUpdate) return { success: false, error: "O trial está desativado nas configurações da plataforma." };

  const { error } = await supabase.from("businesses").update(trialUpdate).eq("id", businessId);
  if (error) return { success: false, error: "Não foi possível liberar o trial." };

  await logAdminAction(adminId, "grant_trial", "business", businessId, { plan: trialUpdate.trial_plan });
  revalidatePath("/admin");
  return { success: true };
}

export type BusinessHistoryEntry = { id: string; action: string; createdAt: string; metadata: Record<string, unknown> | null };

/** Histórico de ações administrativas sobre essa empresa (Seção 12: "Ver histórico"). */
export async function getBusinessHistory(businessId: string): Promise<BusinessHistoryEntry[]> {
  await requireAdmin(["super_admin", "admin", "moderador"]);
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, created_at, metadata")
    .eq("entity_type", "business")
    .eq("entity_id", businessId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, action: row.action, createdAt: row.created_at, metadata: row.metadata }));
}

export async function rejectBusiness(businessId: string, reason: string) {
  const adminId = await requireAdmin(["super_admin", "admin", "moderador"]);
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("businesses")
    .update({ status: "rejected", rejection_reason: reason || null })
    .eq("id", businessId);
  if (error) throw error;

  await logAdminAction(adminId, "reject_business", "business", businessId, { reason: reason || null });

  revalidatePath("/admin");
  revalidatePath("/");
}
