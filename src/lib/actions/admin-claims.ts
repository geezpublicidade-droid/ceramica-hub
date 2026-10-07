"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import { logAdminAction } from "@/lib/audit-log";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/services/email";

type Result = { success: true } | { success: false; error: string };

/**
 * Aprova ou recusa um pedido de reivindicação. Aprovar valida o proprietário do perfil e, se a empresa ainda não tem e-mail
 * de acesso próprio, usa o do solicitante: a pessoa define a senha em "Esqueci minha senha". Nada mais é alterado.
 */
export async function reviewProfileClaim(claimId: string, decision: "approved" | "rejected", note?: string): Promise<Result> {
  let adminId: string;
  try {
    adminId = await requireAdmin(["admin", "comercial"]);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Sem permissão." };
  }
  const supabase = createServiceClient();
  const { data: claim } = await supabase.from("profile_claims").select("id, business_id, claimant_email, claimant_name, status").eq("id", claimId).maybeSingle();
  if (!claim || claim.status !== "pending") return { success: false, error: "Pedido não encontrado ou já analisado." };

  const { error } = await supabase.from("profile_claims").update({ status: decision, reviewed_by: adminId, reviewed_at: new Date().toISOString(), review_note: note?.trim() || null }).eq("id", claimId);
  if (error) return { success: false, error: "Não foi possível salvar a decisão." };

  if (decision === "approved") {
    const { data: business } = await supabase.from("businesses").select("email, name").eq("id", claim.business_id).maybeSingle();
    const update: Record<string, unknown> = { owner_validated: true };
    if (business && !business.email) update.email = claim.claimant_email;
    await supabase.from("businesses").update(update).eq("id", claim.business_id);
    await sendEmail({
      to: claim.claimant_email,
      subject: "Perfil confirmado — Cerâmica Hub",
      html: `<p>Olá, ${claim.claimant_name}! Confirmamos que você representa <strong>${business?.name ?? "a empresa"}</strong>. Acesse o Cerâmica Hub e use "Esqueci minha senha" com este e-mail para criar seu acesso.</p>`,
    });
  }
  await logAdminAction(adminId, `profile_claim_${decision}`, "business", claim.business_id, { claimId, claimant: claim.claimant_email });
  revalidatePath("/admin/reivindicacoes");
  revalidatePath("/[locale]/empresa/[slug]", "page");
  return { success: true };
}
