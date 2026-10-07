"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { getBusinessById } from "@/lib/services/platform";
import { getPlanPriceCents } from "@/lib/services/plan-prices";
import { getCompanyPermissions } from "@/lib/services/company-plan";
import { createPaymentPreference } from "@/lib/services/mercadopago";
import { loadPlanCatalog, planNameFrom } from "@/lib/services/plan-catalog";
import { requireBusinessOwner } from "@/lib/auth-guards";

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
export async function createPaymentLink(plan: string): Promise<CreatePaymentLinkResult> {
  const businessId = await requireBusinessOwner();
  const business = await getBusinessById(businessId);
  if (!business) return { success: false, error: "Empresa não encontrada." };

  const supabase = createServiceClient();
  // preço vem do catálogo comercial (editável no admin); nunca de constante em tela
  const listPriceCents = await getPlanPriceCents(plan);
  if (!listPriceCents) return { success: false, error: "Este plano não está disponível para contratação online. Fale com a equipe." };
  // desconto negociado para esta empresa (definido pelo admin no plano da empresa)
  const permissions = await getCompanyPermissions(businessId);
  const discount = permissions?.discountPercent ?? 0;
  const amountCents = Math.round(listPriceCents * (1 - discount / 100));
  if (amountCents <= 0) return { success: false, error: "Não foi possível gerar a fatura. Fale com a equipe." };

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
    title: `Cerâmica Hub — Plano ${planNameFrom(await loadPlanCatalog(), plan)}`,
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
