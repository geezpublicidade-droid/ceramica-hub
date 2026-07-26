"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guards";
import { logAdminAction } from "@/lib/audit-log";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Aprova ou recusa um pedido de exclusão de dados. Aprovar apaga a empresa
 * de verdade (cascade já cuida de serviços/fotos/benefícios/oportunidades/
 * cenas de tour/assinaturas/faturas/consentimentos — ver migrations) — não
 * dá pra desfazer. O registro do pedido em si sobrevive (sem FK/cascade de
 * propósito) como comprovação de que o pedido foi atendido.
 */
export async function resolveDataDeletionRequest(
  requestId: string,
  approve: boolean,
  notes: string
): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin"]);
  const supabase = createServiceClient();

  const { data: request, error: fetchError } = await supabase
    .from("data_deletion_requests")
    .select("id, business_id, status")
    .eq("id", requestId)
    .single();
  if (fetchError || !request) return { success: false, error: "Solicitação não encontrada." };
  if (request.status !== "pending") return { success: false, error: "Essa solicitação já foi resolvida." };

  if (approve) {
    const { error: deleteError } = await supabase.from("businesses").delete().eq("id", request.business_id);
    if (deleteError) return { success: false, error: "Não foi possível excluir a empresa." };
  }

  const { error: updateError } = await supabase
    .from("data_deletion_requests")
    .update({
      status: approve ? "completed" : "rejected",
      admin_notes: notes.trim() || null,
      resolved_at: new Date().toISOString(),
      resolved_by_admin_id: adminId,
    })
    .eq("id", requestId);
  if (updateError) return { success: false, error: "Não foi possível atualizar a solicitação." };

  await logAdminAction(adminId, approve ? "approve_data_deletion" : "reject_data_deletion", "business", request.business_id, {
    notes: notes.trim() || null,
  });

  revalidatePath("/admin/lgpd");
  return { success: true };
}
