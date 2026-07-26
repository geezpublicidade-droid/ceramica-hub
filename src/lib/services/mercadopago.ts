/**
 * Geração de link de pagamento (Checkout Pro) — cobrança manual, sem
 * webhook: a empresa paga pelo link, e o admin confirma manualmente em
 * /admin/financeiro (ver src/lib/actions/billing.ts). Se
 * MERCADOPAGO_ACCESS_TOKEN não estiver configurado, retorna null em vez de
 * lançar erro — a fatura ainda é criada no banco, só sem link até a chave
 * existir.
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
