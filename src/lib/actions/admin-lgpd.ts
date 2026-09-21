"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guards";
import { logAdminAction } from "@/lib/audit-log";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Aprova ou recusa um pedido de exclusão de dados (empresa OU membro).
 * Aprovar apaga a linha de verdade (cascade já cuida do resto -- serviços/
 * fotos/benefícios/oportunidades/cenas de tour/assinaturas/faturas/
 * consentimentos pra empresa, favoritos pro membro — ver migrations) — não
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
    .select("id, requester_type, business_id, member_id, status")
    .eq("id", requestId)
    .single();
  if (fetchError || !request) return { success: false, error: "Solicitação não encontrada." };
  if (request.status !== "pending") return { success: false, error: "Essa solicitação já foi resolvida." };

  const isMember = request.requester_type === "member";
  const entityId = isMember ? request.member_id : request.business_id;

  if (approve) {
    const { error: deleteError } = await supabase.from(isMember ? "members" : "businesses").delete().eq("id", entityId);
    if (deleteError) return { success: false, error: `Não foi possível excluir ${isMember ? "o membro" : "a empresa"}.` };
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

  await logAdminAction(adminId, approve ? "approve_data_deletion" : "reject_data_deletion", request.requester_type, entityId!, {
    notes: notes.trim() || null,
  });

  revalidatePath("/admin/lgpd");
  return { success: true };
}
