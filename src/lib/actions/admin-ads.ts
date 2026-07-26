"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guards";
import { logAdminAction } from "@/lib/audit-log";

type ActionResult = { success: true } | { success: false; error: string };

const createCampaignSchema = z.object({
  companyName: z.string().trim().min(1, "Informe o nome do anunciante."),
  contactName: z.string().trim().min(1, "Informe o nome do contato."),
  email: z.string().trim().email("Informe um e-mail válido."),
  phone: z.string().trim(),
  placementId: z.string().min(1, "Selecione uma posição."),
  title: z.string().trim().min(1, "Informe o título da campanha."),
  description: z.string().trim().max(200, "Descrição muito longa (máx. 200 caracteres).").optional().or(z.literal("")),
  targetUrl: z.string().trim().url("Informe uma URL válida (com https://)."),
  startsAt: z.string().min(1, "Informe a data de início."),
  endsAt: z.string().min(1, "Informe a data de término."),
  budgetCents: z.number().int().nonnegative().nullable(),
  negotiatedValueCents: z.number().int().nonnegative().nullable(),
  desktopImageUrl: z.string().trim().url("Informe a URL do criativo desktop."),
  mobileImageUrl: z.string().trim().url("Informe a URL do criativo mobile."),
});

export type CreateCampaignInput = z.input<typeof createCampaignSchema>;

/** Cria o anunciante (ou reaproveita um já existente pelo e-mail) + a campanha + os criativos. Sempre entra como pending_review — nunca vai pro ar sem o admin aprovar. */
export async function createAdCampaign(rawInput: CreateCampaignInput): Promise<ActionResult> {
  await requireAdmin(["super_admin", "admin", "comercial"]);
  const parsed = createCampaignSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const input = parsed.data;
  const supabase = createServiceClient();

  const { data: existingAccount } = await supabase
    .from("ad_accounts")
    .select("id")
    .eq("email", input.email.toLowerCase())
    .maybeSingle();

  const accountId =
    existingAccount?.id ??
    (
      await supabase
        .from("ad_accounts")
        .insert({
          company_name: input.companyName,
          contact_name: input.contactName,
          email: input.email.toLowerCase(),
          phone: input.phone.trim() || null,
        })
        .select("id")
        .single()
    ).data?.id;

  if (!accountId) return { success: false, error: "Não foi possível criar o anunciante." };

  const { data: campaign, error: campaignError } = await supabase
    .from("ad_campaigns")
    .insert({
      ad_account_id: accountId,
      placement_id: input.placementId,
      title: input.title,
      description: input.description?.trim() || null,
      target_url: input.targetUrl,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      budget_cents: input.budgetCents,
      negotiated_value_cents: input.negotiatedValueCents,
      status: "pending_review",
    })
    .select("id")
    .single();
  if (campaignError) return { success: false, error: "Não foi possível criar a campanha." };

  const { error: creativeError } = await supabase.from("ad_creatives").insert([
    { campaign_id: campaign.id, device: "desktop", image_url: input.desktopImageUrl, alt_text: input.title },
    { campaign_id: campaign.id, device: "mobile", image_url: input.mobileImageUrl, alt_text: input.title },
  ]);
  if (creativeError) return { success: false, error: "Campanha criada, mas houve erro ao salvar os criativos." };

  revalidatePath("/admin/publicidade");
  return { success: true };
}

async function updateCampaignStatus(campaignId: string, status: string, rejectionReason?: string): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin", "comercial"]);
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("ad_campaigns")
    .update({ status, rejection_reason: rejectionReason ?? null })
    .eq("id", campaignId);
  if (error) return { success: false, error: "Não foi possível atualizar a campanha." };

  await logAdminAction(adminId, `ad_campaign_${status}`, "ad_campaign", campaignId);
  revalidatePath("/admin/publicidade");
  return { success: true };
}

export async function approveCampaign(campaignId: string): Promise<ActionResult> {
  return updateCampaignStatus(campaignId, "approved");
}

export async function rejectCampaign(campaignId: string, reason: string): Promise<ActionResult> {
  return updateCampaignStatus(campaignId, "rejected", reason);
}

export async function pauseCampaign(campaignId: string): Promise<ActionResult> {
  return updateCampaignStatus(campaignId, "paused");
}

export async function resumeCampaign(campaignId: string): Promise<ActionResult> {
  return updateCampaignStatus(campaignId, "approved");
}

/** Bloquear um anunciante tira TODAS as campanhas dele do ar imediatamente (checado em getActiveCampaignForPlacement), mesmo sem mexer no status de cada campanha individualmente. */
export async function toggleBlockAdvertiser(accountId: string, blocked: boolean): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin", "comercial"]);
  const supabase = createServiceClient();
  const { error } = await supabase.from("ad_accounts").update({ blocked }).eq("id", accountId);
  if (error) return { success: false, error: "Não foi possível atualizar o anunciante." };

  await logAdminAction(adminId, blocked ? "block_advertiser" : "unblock_advertiser", "ad_account", accountId);
  revalidatePath("/admin/publicidade");
  return { success: true };
}
