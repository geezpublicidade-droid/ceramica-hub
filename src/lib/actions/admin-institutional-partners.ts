"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guards";
import { logAdminAction } from "@/lib/audit-log";
import { FOUNDER_QUOTA, PARTNER_TIERS, type PartnerTier } from "@/lib/partner-tiers";

type ActionResult = { success: true } | { success: false; error: string };

const STATUSES = ["rascunho", "aguardando_autorizacao", "aprovado", "ativo", "inativo"] as const;

const createPartnerSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  logoUrl: z.string().trim().url("URL de logo inválida.").optional().or(z.literal("")),
  link: z.string().trim().url("Link inválido.").optional().or(z.literal("")),
  partnershipType: z.string().trim().min(1, "Informe o tipo de vínculo."),
  tier: z.enum(PARTNER_TIERS).default("parceiro_premium"),
  authorizationNote: z.string().trim().max(500).optional().or(z.literal("")),
});

/** Sempre cria como "rascunho" -- nunca entra publicado; alguém precisa mover manualmente pra "ativo" depois de confirmar a autorização real. */
async function founderQuotaError(excludingPartnerId?: string): Promise<string | null> {
  const supabase = createServiceClient();
  let query = supabase
    .from("institutional_partners")
    .select("id", { count: "exact", head: true })
    .eq("tier", "ancora_fundadora")
    .neq("status", "inativo");
  if (excludingPartnerId) query = query.neq("id", excludingPartnerId);
  const { count } = await query;
  return (count ?? 0) >= FOUNDER_QUOTA ? `As ${FOUNDER_QUOTA} cotas de Âncora Fundadora já estão preenchidas.` : null;
}

export async function createInstitutionalPartner(rawInput: z.input<typeof createPartnerSchema>): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin"]);
  const parsed = createPartnerSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  if (parsed.data.tier === "ancora_fundadora") {
    const quotaError = await founderQuotaError();
    if (quotaError) return { success: false, error: quotaError };
  }

  const supabase = createServiceClient();
  const { data: partner, error } = await supabase
    .from("institutional_partners")
    .insert({
      name: parsed.data.name,
      logo_url: parsed.data.logoUrl || null,
      link: parsed.data.link || null,
      partnership_type: parsed.data.partnershipType,
      tier: parsed.data.tier,
      authorization_note: parsed.data.authorizationNote || null,
      status: "rascunho",
    })
    .select("id")
    .single();
  if (error || !partner) return { success: false, error: "Não foi possível criar o parceiro." };

  await logAdminAction(adminId, "create_institutional_partner", "institutional_partner", partner.id, { name: parsed.data.name });
  revalidatePath("/admin/parceiros");
  return { success: true };
}

export async function updatePartnerStatus(partnerId: string, status: (typeof STATUSES)[number]): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin"]);
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("institutional_partners")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", partnerId);
  if (error) return { success: false, error: "Não foi possível atualizar o status." };

  await logAdminAction(adminId, "update_institutional_partner_status", "institutional_partner", partnerId, { status });
  revalidatePath("/admin/parceiros");
  revalidatePath("/preview");
  return { success: true };
}

export async function updatePartnerTier(partnerId: string, tier: PartnerTier): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin"]);
  if (!PARTNER_TIERS.includes(tier)) return { success: false, error: "Nível inválido." };

  if (tier === "ancora_fundadora") {
    const quotaError = await founderQuotaError(partnerId);
    if (quotaError) return { success: false, error: quotaError };
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("institutional_partners")
    .update({ tier, updated_at: new Date().toISOString() })
    .eq("id", partnerId);
  if (error) return { success: false, error: "Não foi possível atualizar o nível." };

  await logAdminAction(adminId, "update_institutional_partner_tier", "institutional_partner", partnerId, { tier });
  revalidatePath("/admin/parceiros");
  revalidatePath("/preview");
  return { success: true };
}

export async function deleteInstitutionalPartner(partnerId: string): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin"]);
  const supabase = createServiceClient();

  const { error } = await supabase.from("institutional_partners").delete().eq("id", partnerId);
  if (error) return { success: false, error: "Não foi possível excluir." };

  await logAdminAction(adminId, "delete_institutional_partner", "institutional_partner", partnerId, {});
  revalidatePath("/admin/parceiros");
  return { success: true };
}
