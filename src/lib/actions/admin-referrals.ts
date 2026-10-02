"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guards";
import { logAdminAction } from "@/lib/audit-log";

type ActionResult = { success: true } | { success: false; error: string };

const MAX_NOTE_LENGTH = 300;

/** Marca a recompensa de uma indicação convertida como concedida, com a descrição do que foi dado. */
export async function grantReferralReward(referralId: string, note: string): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin", "financeiro", "comercial"]);
  const trimmed = note.trim();
  if (!trimmed) return { success: false, error: "Descreva a recompensa concedida." };
  if (trimmed.length > MAX_NOTE_LENGTH) return { success: false, error: `Use até ${MAX_NOTE_LENGTH} caracteres.` };

  const { data, error } = await createServiceClient()
    .from("referrals")
    .update({ reward_status: "concedida", reward_note: trimmed, rewarded_at: new Date().toISOString() })
    .eq("id", referralId)
    .eq("reward_status", "pendente")
    .select("id")
    .maybeSingle();
  if (error) return { success: false, error: "Não foi possível registrar a recompensa." };
  if (!data) return { success: false, error: "Essa indicação não tem recompensa pendente." };

  await logAdminAction(adminId, "grant_referral_reward", "referral", referralId, { note: trimmed });
  revalidatePath("/admin/indicacoes");
  return { success: true };
}
