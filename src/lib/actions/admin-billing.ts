"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import { logAdminAction } from "@/lib/audit-log";
import { activateInvoice } from "@/lib/services/billing-activation";

type ActionResult = { success: true } | { success: false; error: string };

const ACTIVATION_ERRORS = {
  not_found: "Fatura não encontrada.",
  already_paid: "Essa fatura já foi confirmada.",
  subscription_missing: "Assinatura não encontrada.",
  update_failed: "Não foi possível confirmar a fatura.",
} as const;

/**
 * Confirmação manual de pagamento (fallback quando o webhook do Mercado Pago está desligado ou falhou):
 * o admin viu o pagamento cair e confirma aqui. Usa a mesma ativação do webhook.
 */
export async function confirmInvoicePayment(invoiceId: string): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin", "financeiro"]);

  const result = await activateInvoice(invoiceId, adminId);
  if (!result.ok) return { success: false, error: ACTIVATION_ERRORS[result.reason] };

  await logAdminAction(adminId, "confirm_invoice_payment", "invoice", invoiceId, {
    businessId: result.businessId,
    plan: result.plan,
  });

  revalidatePath("/admin/financeiro");
  revalidatePath("/dashboard");
  return { success: true };
}
