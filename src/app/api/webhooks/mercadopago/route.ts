import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isValidMercadoPagoSignature } from "@/lib/mercadopago-signature";
import { fetchPayment } from "@/lib/services/mercadopago";
import { activateInvoice } from "@/lib/services/billing-activation";
import { isFeatureEnabled } from "@/lib/services/feature-flags";

export const dynamic = "force-dynamic";

type EventStatus = "processed" | "ignored" | "failed";

async function finishEvent(eventId: string, status: EventStatus, invoiceId: string | null, error?: string) {
  await createServiceClient()
    .from("payment_events")
    .update({ status, invoice_id: invoiceId, error: error ?? null, processed_at: new Date().toISOString() })
    .eq("id", eventId);
}

/**
 * Notificação de pagamento do Mercado Pago. Assinatura validada (HMAC), pagamento reconsultado na
 * API, evento gravado em `payment_events` com chave única (webhook repetido = processado uma vez)
 * e valor conferido contra a fatura antes de ativar o plano.
 */
export async function POST(request: Request) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret || !process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return NextResponse.json({ error: "Webhook não configurado." }, { status: 503 });
  }

  const url = new URL(request.url);
  const body = (await request.json().catch(() => null)) as { type?: string; data?: { id?: string | number } } | null;
  const dataId = url.searchParams.get("data.id") ?? (body?.data?.id != null ? String(body.data.id) : null);

  const signed = isValidMercadoPagoSignature(secret, {
    xSignature: request.headers.get("x-signature"),
    xRequestId: request.headers.get("x-request-id"),
    dataId: url.searchParams.get("data.id"),
  });
  if (!signed) return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });

  const type = url.searchParams.get("type") ?? body?.type;
  if (type !== "payment" || !dataId) return NextResponse.json({ ok: true, ignored: true });

  const payment = await fetchPayment(dataId);
  if (!payment) return NextResponse.json({ error: "Pagamento não encontrado." }, { status: 502 });

  const supabase = createServiceClient();
  const eventKey = `payment:${payment.id}:${payment.status}`;
  const { data: inserted, error: insertError } = await supabase
    .from("payment_events")
    .insert({
      event_key: eventKey,
      event_type: type,
      payload: { paymentId: payment.id, status: payment.status, amount: payment.amount, externalReference: payment.externalReference },
    })
    .select("id")
    .maybeSingle();

  let eventId = inserted?.id as string | undefined;
  if (insertError) {
    // chave duplicada: só reprocessa se a tentativa anterior não terminou (failed/received)
    const { data: existing } = await supabase
      .from("payment_events")
      .select("id, status")
      .eq("provider", "mercadopago")
      .eq("event_key", eventKey)
      .maybeSingle();
    if (!existing) return NextResponse.json({ error: "Falha ao registrar evento." }, { status: 500 });
    if (existing.status === "processed" || existing.status === "ignored") return NextResponse.json({ ok: true, duplicate: true });
    eventId = existing.id;
  }
  if (!eventId) return NextResponse.json({ error: "Falha ao registrar evento." }, { status: 500 });

  if (payment.status !== "approved") {
    await finishEvent(eventId, "ignored", payment.externalReference, `status ${payment.status}`);
    return NextResponse.json({ ok: true });
  }

  if (!(await isFeatureEnabled("billing_auto_activation", true))) {
    await finishEvent(eventId, "ignored", payment.externalReference, "ativação automática desligada (flag)");
    return NextResponse.json({ ok: true });
  }

  const invoiceId = payment.externalReference;
  const { data: invoice } = invoiceId
    ? await supabase.from("invoices").select("id, amount_cents").eq("id", invoiceId).maybeSingle()
    : { data: null };
  if (!invoice) {
    await finishEvent(eventId, "failed", null, "fatura não encontrada pelo external_reference");
    return NextResponse.json({ ok: true });
  }
  if (Math.round(payment.amount * 100) !== invoice.amount_cents) {
    await finishEvent(eventId, "failed", invoice.id, `valor divergente: pago ${payment.amount}, fatura ${invoice.amount_cents / 100}`);
    return NextResponse.json({ ok: true });
  }

  const result = await activateInvoice(invoice.id, null);
  if (result.ok || result.reason === "already_paid") {
    await finishEvent(eventId, "processed", invoice.id);
    return NextResponse.json({ ok: true });
  }

  await finishEvent(eventId, "failed", invoice.id, result.reason);
  return NextResponse.json({ error: "Falha ao ativar o plano." }, { status: 500 });
}
