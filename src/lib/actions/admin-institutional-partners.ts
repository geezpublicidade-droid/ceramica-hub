"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guards";
import { logAdminAction } from "@/lib/audit-log";

type ActionResult = { success: true } | { success: false; error: string };

const STATUSES = ["rascunho", "aguardando_autorizacao", "aprovado", "ativo", "inativo"] as const;

const createPartnerSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  logoUrl: z.string().trim().url("URL de logo inválida.").optional().or(z.literal("")),
  link: z.string().trim().url("Link inválido.").optional().or(z.literal("")),
  partnershipType: z.string().trim().min(1, "Informe o tipo de vínculo."),
  authorizationNote: z.string().trim().max(500).optional().or(z.literal("")),
});

/** Sempre cria como "rascunho" -- nunca entra publicado; alguém precisa mover manualmente pra "ativo" depois de confirmar a autorização real. */
export async function createInstitutionalPartner(rawInput: z.infer<typeof createPartnerSchema>): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin"]);
  const parsed = createPartnerSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = createServiceClient();
  const { data: partner, error } = await supabase
    .from("institutional_partners")
    .insert({
      name: parsed.data.name,
      logo_url: parsed.data.logoUrl || null,
      link: parsed.data.link || null,
      partnership_type: parsed.data.partnershipType,
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

export async function deleteInstitutionalPartner(partnerId: string): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin"]);
  const supabase = createServiceClient();

  const { error } = await supabase.from("institutional_partners").delete().eq("id", partnerId);
  if (error) return { success: false, error: "Não foi possível excluir." };

  await logAdminAction(adminId, "delete_institutional_partner", "institutional_partner", partnerId, {});
  revalidatePath("/admin/parceiros");
  return { success: true };
}
