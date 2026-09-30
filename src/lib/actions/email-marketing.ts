"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import type { AdminRole } from "@/auth";
import { logAdminAction } from "@/lib/audit-log";
import {
  createAudience,
  deleteAudience,
  previewAudience,
  type AudienceFilters,
  type AudiencePreview,
} from "@/lib/services/marketing-audiences";
import {
  EMAIL_KIND_LABEL,
  createCampaign,
  createTemplate,
  deleteDraftCampaign,
  deleteTemplate,
  grantConsent,
  sendCampaign,
  unsubscribeByToken,
  type EmailKind,
  type SendCampaignResult,
} from "@/lib/services/email-marketing";

type ActionResult<T = object> = ({ success: true } & T) | { success: false; error: string };

const MARKETING_PATH = "/admin/marketing";
const EMAIL_ROLES: AdminRole[] = ["super_admin", "admin", "marketing"];

function isEmailKind(value: string): value is EmailKind {
  return value in EMAIL_KIND_LABEL;
}

export async function previewAudienceAction(filters: AudienceFilters): Promise<ActionResult<{ preview: AudiencePreview }>> {
  await requireAdmin(EMAIL_ROLES);
  const preview = await previewAudience(filters);
  // Não devolve e-mails ao navegador: o preview só precisa dos totais e dos nomes.
  return { success: true, preview: { ...preview, recipients: preview.recipients.slice(0, 20).map((r) => ({ ...r, email: "" })) } };
}

export async function createAudienceAction(input: {
  name: string;
  description: string | null;
  filters: AudienceFilters;
}): Promise<ActionResult> {
  const adminId = await requireAdmin(EMAIL_ROLES);
  if (!input.name.trim()) return { success: false, error: "Dê um nome ao público." };

  const id = await createAudience(input, adminId);
  await logAdminAction(adminId, "create_audience", "marketing_audience", id, { name: input.name });
  revalidatePath(`${MARKETING_PATH}/publicos`);
  return { success: true };
}

export async function deleteAudienceAction(id: string): Promise<ActionResult> {
  const adminId = await requireAdmin(EMAIL_ROLES);
  await deleteAudience(id);
  await logAdminAction(adminId, "delete_audience", "marketing_audience", id, {});
  revalidatePath(`${MARKETING_PATH}/publicos`);
  return { success: true };
}

export async function createTemplateAction(input: {
  name: string;
  kind: string;
  subject: string;
  bodyHtml: string;
}): Promise<ActionResult> {
  const adminId = await requireAdmin(EMAIL_ROLES);
  if (!isEmailKind(input.kind)) return { success: false, error: "Tipo de e-mail inválido." };
  if (!input.name.trim() || !input.subject.trim() || !input.bodyHtml.trim()) {
    return { success: false, error: "Nome, assunto e conteúdo são obrigatórios." };
  }

  const id = await createTemplate({ ...input, kind: input.kind }, adminId);
  await logAdminAction(adminId, "create_email_template", "email_template", id, { name: input.name });
  revalidatePath(`${MARKETING_PATH}/email`);
  return { success: true };
}

export async function deleteTemplateAction(id: string): Promise<ActionResult> {
  const adminId = await requireAdmin(EMAIL_ROLES);
  await deleteTemplate(id);
  await logAdminAction(adminId, "delete_email_template", "email_template", id, {});
  revalidatePath(`${MARKETING_PATH}/email`);
  return { success: true };
}

export async function createCampaignAction(input: {
  name: string;
  kind: string;
  subject: string;
  bodyHtml: string;
  audienceId: string;
}): Promise<ActionResult> {
  const adminId = await requireAdmin(EMAIL_ROLES);
  if (!isEmailKind(input.kind)) return { success: false, error: "Tipo de e-mail inválido." };
  if (!input.name.trim() || !input.subject.trim() || !input.bodyHtml.trim()) {
    return { success: false, error: "Nome, assunto e conteúdo são obrigatórios." };
  }
  if (!input.audienceId) return { success: false, error: "Escolha o público." };

  const id = await createCampaign({ ...input, kind: input.kind }, adminId);
  await logAdminAction(adminId, "create_email_campaign", "email_campaign", id, { name: input.name });
  revalidatePath(`${MARKETING_PATH}/email`);
  return { success: true };
}

export async function sendCampaignAction(id: string): Promise<ActionResult<{ result: SendCampaignResult }>> {
  const adminId = await requireAdmin(EMAIL_ROLES);
  try {
    const result = await sendCampaign(id);
    await logAdminAction(adminId, "send_email_campaign", "email_campaign", id, { ...result });
    revalidatePath(`${MARKETING_PATH}/email`);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Não foi possível enviar." };
  }
}

export async function deleteCampaignAction(id: string): Promise<ActionResult> {
  const adminId = await requireAdmin(EMAIL_ROLES);
  await deleteDraftCampaign(id);
  await logAdminAction(adminId, "delete_email_campaign", "email_campaign", id, {});
  revalidatePath(`${MARKETING_PATH}/email`);
  return { success: true };
}

export async function grantConsentAction(businessId: string, note: string): Promise<ActionResult> {
  const adminId = await requireAdmin(EMAIL_ROLES);
  if (!note.trim()) return { success: false, error: "Informe como o consentimento foi obtido." };

  await grantConsent(businessId, note);
  await logAdminAction(adminId, "grant_email_consent", "business", businessId, { note });
  revalidatePath(`${MARKETING_PATH}/publicos`);
  return { success: true };
}

/** Ação pública (sem login): o token do e-mail é a credencial. */
export async function unsubscribeAction(token: string): Promise<ActionResult> {
  const outcome = await unsubscribeByToken(token);
  return outcome.found ? { success: true } : { success: false, error: "Link de descadastro inválido." };
}
