"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { getMemberId } from "@/lib/auth-guards";

type ActionResult = { success: true } | { success: false; error: string };

/** Mesmo raciocínio do export de empresa (lgpd.ts): junta o que o próprio
 * membro forneceu e devolve como JSON pra download imediato, sem fila. */
export async function requestMemberDataExport(): Promise<
  { success: true; data: Record<string, unknown> } | { success: false; error: string }
> {
  const memberId = await getMemberId();
  if (!memberId) return { success: false, error: "Não autenticado." };
  const supabase = createServiceClient();

  const [member, favorites] = await Promise.all([
    supabase.from("members").select("*").eq("id", memberId).single(),
    supabase.from("member_favorites").select("business_id, created_at").eq("member_id", memberId),
  ]);
  if (member.error) return { success: false, error: "Não foi possível reunir seus dados." };

  const { password_hash, ...memberData } = member.data as Record<string, unknown>;
  void password_hash;

  await supabase.from("audit_logs").insert({
    actor_type: "member",
    actor_id: memberId,
    action: "data_export_requested",
    entity_type: "member",
    entity_id: memberId,
  });

  return {
    success: true,
    data: {
      exportedAt: new Date().toISOString(),
      member: memberData,
      favorites: favorites.data ?? [],
    },
  };
}

/** Direito ao esquecimento pro membro -- vira pedido pendente em
 * `data_deletion_requests` (mesma fila que o admin já revisa em
 * /admin/lgpd), nunca exclusão imediata. Ver resolveDataDeletionRequest em
 * admin-lgpd.ts. */
export async function requestMemberDataDeletion(reason: string): Promise<ActionResult> {
  const memberId = await getMemberId();
  if (!memberId) return { success: false, error: "Não autenticado." };
  const supabase = createServiceClient();

  const { data: member } = await supabase.from("members").select("name").eq("id", memberId).single();
  if (!member) return { success: false, error: "Membro não encontrado." };

  const { data: existing } = await supabase
    .from("data_deletion_requests")
    .select("id")
    .eq("member_id", memberId)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) return { success: false, error: "Você já tem uma solicitação de exclusão pendente." };

  const { error } = await supabase.from("data_deletion_requests").insert({
    requester_type: "member",
    member_id: memberId,
    member_name: member.name,
    reason: reason.trim() || null,
  });
  if (error) return { success: false, error: "Não foi possível registrar a solicitação." };

  await supabase.from("audit_logs").insert({
    actor_type: "member",
    actor_id: memberId,
    action: "data_deletion_requested",
    entity_type: "member",
    entity_id: memberId,
    metadata: { reason: reason.trim() || null },
  });

  return { success: true };
}
