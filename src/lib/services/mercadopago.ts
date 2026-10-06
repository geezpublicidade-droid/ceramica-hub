/**
 * Checkout Pro do Mercado Pago. A empresa paga pelo link e o webhook
 * (/api/webhooks/mercadopago) ativa o plano; a confirmação manual em /admin/financeiro
 * continua como fallback. Sem MERCADOPAGO_ACCESS_TOKEN, createPaymentPreference retorna
 * null em vez de lançar erro — a fatura ainda é criada, só sem link.
 */
export type PaymentPreference = { id: string; initPoint: string };

export async function createPaymentPreference(input: {
  title: string;
  unitPrice: number;
  externalReference: string;
}): Promise<PaymentPreference | null> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    console.warn("[mercadopago] MERCADOPAGO_ACCESS_TOKEN não configurado — link não gerado.");
    return null;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [
          {
            title: input.title,
            quantity: 1,
            unit_price: input.unitPrice,
            currency_id: "BRL",
          },
        ],
        external_reference: input.externalReference,
        notification_url: `${siteUrl}/api/webhooks/mercadopago`,
        back_urls: {
          success: `${siteUrl}/dashboard`,
          pending: `${siteUrl}/dashboard`,
          failure: `${siteUrl}/dashboard`,
        },
      }),
    });

    if (!response.ok) {
      console.error("[mercadopago] falha ao criar preferência:", await response.text());
      return null;
    }

    const data = (await response.json()) as { id: string; init_point: string };
    return { id: data.id, initPoint: data.init_point };
  } catch (err) {
    console.error("[mercadopago] erro ao criar preferência:", err);
    return null;
  }
}

export type MercadoPagoPayment = {
  id: number;
  status: string;
  externalReference: string | null;
  amount: number;
};

/** Busca o pagamento direto na API (nunca confia no corpo do webhook, que só traz o id). null = falha ou não encontrado. */
export async function fetchPayment(paymentId: string): Promise<MercadoPagoPayment | null> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) return null;

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      console.error("[mercadopago] falha ao buscar pagamento:", response.status);
      return null;
    }
    const data = (await response.json()) as {
      id: number;
      status: string;
      external_reference?: string | null;
      transaction_amount: number;
    };
    return {
      id: data.id,
      status: data.status,
      externalReference: data.external_reference ?? null,
      amount: data.transaction_amount,
    };
  } catch (err) {
    console.error("[mercadopago] erro ao buscar pagamento:", err);
    return null;
  }
}
