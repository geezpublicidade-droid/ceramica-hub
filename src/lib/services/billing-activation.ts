import { createServiceClient } from "@/lib/supabase/server";
import { markReferralConverted } from "@/lib/services/referrals";
import { changeCompanyPlan } from "@/lib/services/plan-admin";

export const SUBSCRIPTION_DAYS = 30;

export type ActivationResult =
  | { ok: true; businessId: string; plan: string }
  | { ok: false; reason: "not_found" | "already_paid" | "subscription_missing" | "update_failed" };

/**
 * Ativa o plano a partir de uma fatura paga. Usada pela confirmação manual (admin) e pelo
 * webhook do Mercado Pago. A fatura é "reivindicada" por um UPDATE condicional (`status = pending`),
 * então duas chamadas simultâneas ou um webhook repetido ativam uma única vez.
 */
export async function activateInvoice(invoiceId: string, confirmedByAdminId: string | null): Promise<ActivationResult> {
  const supabase = createServiceClient();
  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000);

  const { data: claimed, error: claimError } = await supabase
    .from("invoices")
    .update({ status: "paid", confirmed_by_admin_id: confirmedByAdminId, confirmed_at: startedAt.toISOString() })
    .eq("id", invoiceId)
    .eq("status", "pending")
    .select("id, business_id, subscription_id")
    .maybeSingle();
  if (claimError) return { ok: false, reason: "update_failed" };

  if (!claimed) {
    const { data: existing } = await supabase.from("invoices").select("status").eq("id", invoiceId).maybeSingle();
    return { ok: false, reason: existing ? "already_paid" : "not_found" };
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, plan")
    .eq("id", claimed.subscription_id)
    .maybeSingle();
  if (!subscription) return { ok: false, reason: "subscription_missing" };

  await supabase
    .from("subscriptions")
    .update({ status: "active", started_at: startedAt.toISOString(), ends_at: endsAt.toISOString() })
    .eq("id", subscription.id);
  // ativa pelo serviço central: grava plano, status ativo, início e vencimento, registra no histórico e avisa empresa e admins
  await changeCompanyPlan({
    businessId: claimed.business_id,
    plan: subscription.plan,
    status: "active",
    startedAt: startedAt.toISOString(),
    expiresAt: endsAt.toISOString(),
    billingCycle: "monthly",
    manualOverride: false,
    kind: "payment",
    reason: confirmedByAdminId ? "Pagamento confirmado manualmente pelo admin" : "Pagamento aprovado (Mercado Pago)",
    actor: confirmedByAdminId ? { type: "admin", id: confirmedByAdminId } : { type: "system" },
  });

  try {
    await markReferralConverted(claimed.business_id);
  } catch (referralError) {
    console.error("[referrals] falha ao converter indicação:", referralError);
  }

  return { ok: true, businessId: claimed.business_id, plan: subscription.plan };
}
