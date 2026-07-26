"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { getBusinessById } from "@/lib/services/platform";
import { PLAN_PRICES_CENTS, type PayablePlan } from "@/lib/plan-limits";
import { createPaymentPreference } from "@/lib/services/mercadopago";
import { planLabels } from "@/data/businesses";
import { requireOwnBusiness } from "@/lib/auth-guards";

type CreatePaymentLinkResult =
  | { success: true; paymentLink: string | null }
  | { success: false; error: string };

/**
 * Cria a assinatura (pending) + a fatura pro plano escolhido e tenta gerar
 * o link de pagamento no Mercado Pago. O plano só é ativado de verdade
 * quando o admin confirmar o pagamento em /admin/financeiro
 * (ver confirmInvoicePayment em admin-billing.ts) — nada aqui muda
 * `businesses.plan` ainda.
 */
export async function createPaymentLink(plan: PayablePlan): Promise<CreatePaymentLinkResult> {
  const businessId = await requireOwnBusiness();
  const business = await getBusinessById(businessId);
  if (!business) return { success: false, error: "Empresa não encontrada." };

  const supabase = createServiceClient();
  const amountCents = PLAN_PRICES_CENTS[plan];

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .insert({ business_id: businessId, plan, status: "pending" })
    .select("id")
    .single();
  if (subscriptionError) return { success: false, error: "Não foi possível iniciar a assinatura." };

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      business_id: businessId,
      subscription_id: subscription.id,
      amount_cents: amountCents,
      status: "pending",
    })
    .select("id")
    .single();
  if (invoiceError) return { success: false, error: "Não foi possível gerar a fatura." };

  const preference = await createPaymentPreference({
    title: `Cerâmica Hub — Plano ${planLabels[plan]}`,
    unitPrice: amountCents / 100,
    externalReference: invoice.id,
  });

  if (preference) {
    await supabase
      .from("invoices")
      .update({ mercadopago_link: preference.initPoint, mercadopago_id: preference.id })
      .eq("id", invoice.id);
  }

  return { success: true, paymentLink: preference?.initPoint ?? null };
}
