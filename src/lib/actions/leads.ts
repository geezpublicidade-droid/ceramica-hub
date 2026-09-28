"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guards";
import type { AdminRole } from "@/auth";
import { logAdminAction } from "@/lib/audit-log";
import { createLead, type CreateLeadInput, type LeadStage, type LeadTemperature } from "@/lib/services/leads";

type ActionResult = { success: true } | { success: false; error: string };

const LEADS_PATH = "/admin/leads";
const OWNER_ROLES: AdminRole[] = ["super_admin", "admin", "comercial"];

export async function createLeadAction(input: CreateLeadInput): Promise<ActionResult> {
  const adminId = await requireAdmin(OWNER_ROLES);
  if (!input.contactName.trim()) return { success: false, error: "Nome do contato é obrigatório." };

  const id = await createLead(input);
  await logAdminAction(adminId, "create_lead", "lead", id, { contactName: input.contactName, source: input.source });
  revalidatePath(LEADS_PATH);
  return { success: true };
}

export async function updateLeadStageAction(
  leadId: string,
  stage: LeadStage,
  lossReason?: string
): Promise<ActionResult> {
  const adminId = await requireAdmin(OWNER_ROLES);
  const supabase = createServiceClient();

  const patch: Record<string, unknown> = { stage };
  if (stage === "perdido") patch.loss_reason = lossReason?.trim() || null;

  const { error } = await supabase.from("leads").update(patch).eq("id", leadId);
  if (error) return { success: false, error: "Não foi possível mover o lead." };

  await logAdminAction(adminId, "update_lead_stage", "lead", leadId, { stage, lossReason });
  revalidatePath(LEADS_PATH);
  return { success: true };
}

export async function updateLeadOwnerAction(leadId: string, ownerAdminId: string | null): Promise<ActionResult> {
  const adminId = await requireAdmin(OWNER_ROLES);
  const supabase = createServiceClient();

  const { error } = await supabase.from("leads").update({ owner_admin_id: ownerAdminId }).eq("id", leadId);
  if (error) return { success: false, error: "Não foi possível atribuir o responsável." };

  await logAdminAction(adminId, "update_lead_owner", "lead", leadId, { ownerAdminId });
  revalidatePath(LEADS_PATH);
  return { success: true };
}

export async function updateLeadFollowUpAction(
  leadId: string,
  input: { nextAction?: string; nextActionAt?: string | null; notes?: string; temperature?: LeadTemperature }
): Promise<ActionResult> {
  const adminId = await requireAdmin(OWNER_ROLES);
  const supabase = createServiceClient();

  const patch: Record<string, unknown> = { last_contact_at: new Date().toISOString() };
  if (input.nextAction !== undefined) patch.next_action = input.nextAction.trim() || null;
  if (input.nextActionAt !== undefined) patch.next_action_at = input.nextActionAt || null;
  if (input.notes !== undefined) patch.notes = input.notes.trim() || null;
  if (input.temperature !== undefined) patch.temperature = input.temperature;

  const { error } = await supabase.from("leads").update(patch).eq("id", leadId);
  if (error) return { success: false, error: "Não foi possível registrar o acompanhamento." };

  await logAdminAction(adminId, "update_lead_followup", "lead", leadId, input);
  revalidatePath(LEADS_PATH);
  return { success: true };
}

/** Vincula o lead como contato comercial de uma empresa já cadastrada (ex:
 * empresa do complexo que também virou anunciante) -- não cria empresa nova,
 * que continua exigindo o fluxo completo de /cadastro (torre/andar/sala). */
export async function convertLeadToContactAction(leadId: string, businessId: string): Promise<ActionResult> {
  const adminId = await requireAdmin(OWNER_ROLES);
  const supabase = createServiceClient();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("contact_name, job_title, phone, whatsapp, email")
    .eq("id", leadId)
    .maybeSingle();
  if (leadError || !lead) return { success: false, error: "Lead não encontrado." };

  const { error: contactError } = await supabase.from("contacts").insert({
    business_id: businessId,
    name: lead.contact_name,
    job_title: lead.job_title,
    phone: lead.phone,
    whatsapp: lead.whatsapp,
    email: lead.email,
  });
  if (contactError) return { success: false, error: "Não foi possível criar o contato." };

  const { error: updateError } = await supabase
    .from("leads")
    .update({ stage: "fechado", converted_business_id: businessId })
    .eq("id", leadId);
  if (updateError) return { success: false, error: "Contato criado, mas não foi possível fechar o lead." };

  await logAdminAction(adminId, "convert_lead_to_contact", "lead", leadId, { businessId });
  revalidatePath(LEADS_PATH);
  return { success: true };
}

/** Vincula o lead como conta de anunciante (`ad_accounts`) -- caminho pra
 * empresas externas ao complexo que só podem aparecer como anunciante,
 * nunca com perfil público (ver CONCEITO DO SISTEMA). */
export async function convertLeadToAdvertiserAction(leadId: string): Promise<ActionResult> {
  const adminId = await requireAdmin(OWNER_ROLES);
  const supabase = createServiceClient();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("contact_name, company_name, email, phone")
    .eq("id", leadId)
    .maybeSingle();
  if (leadError || !lead) return { success: false, error: "Lead não encontrado." };
  if (!lead.email) return { success: false, error: "Lead precisa de e-mail pra virar conta de anunciante." };

  const { data: account, error: accountError } = await supabase
    .from("ad_accounts")
    .insert({
      company_name: lead.company_name || lead.contact_name,
      contact_name: lead.contact_name,
      email: lead.email,
      phone: lead.phone,
    })
    .select("id")
    .single();
  if (accountError || !account) return { success: false, error: "Não foi possível criar a conta de anunciante." };

  const { error: updateError } = await supabase.from("leads").update({ stage: "fechado" }).eq("id", leadId);
  if (updateError) return { success: false, error: "Conta criada, mas não foi possível fechar o lead." };

  await logAdminAction(adminId, "convert_lead_to_advertiser", "lead", leadId, { adAccountId: account.id });
  revalidatePath(LEADS_PATH);
  revalidatePath("/admin/publicidade");
  return { success: true };
}
