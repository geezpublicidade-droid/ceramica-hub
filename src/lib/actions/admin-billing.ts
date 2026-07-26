"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guards";
import { logAdminAction } from "@/lib/audit-log";

type ActionResult = { success: true } | { success: false; error: string };

const SUBSCRIPTION_DAYS = 30;

/**
 * Confirmação manual de pagamento (Fase 1, sem webhook): o admin viu o
 * pagamento cair no Mercado Pago e confirma aqui. Isso marca a fatura como
 * paga, ativa a assinatura por 30 dias e atualiza o plano da empresa.
 */
export async function confirmInvoicePayment(invoiceId: string): Promise<ActionResult> {
  const adminId = await requireAdmin();
  const supabase = createServiceClient();

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id, business_id, subscription_id, status")
    .eq("id", invoiceId)
    .single();
  if (invoiceError || !invoice) return { success: false, error: "Fatura não encontrada." };
  if (invoice.status === "paid") return { success: false, error: "Essa fatura já foi confirmada." };

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("id, plan")
    .eq("id", invoice.subscription_id)
    .single();
  if (subscriptionError || !subscription) return { success: false, error: "Assinatura não encontrada." };

  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000);

  const { error: invoiceUpdateError } = await supabase
    .from("invoices")
    .update({ status: "paid", confirmed_by_admin_id: adminId, confirmed_at: startedAt.toISOString() })
    .eq("id", invoiceId);
  if (invoiceUpdateError) return { success: false, error: "Não foi possível confirmar a fatura." };

  await supabase
    .from("subscriptions")
    .update({ status: "active", started_at: startedAt.toISOString(), ends_at: endsAt.toISOString() })
    .eq("id", subscription.id);

  await supabase.from("businesses").update({ plan: subscription.plan }).eq("id", invoice.business_id);

  await logAdminAction(adminId, "confirm_invoice_payment", "invoice", invoiceId, {
    businessId: invoice.business_id,
    plan: subscription.plan,
  });

  revalidatePath("/admin/financeiro");
  revalidatePath("/dashboard");
  return { success: true };
}
