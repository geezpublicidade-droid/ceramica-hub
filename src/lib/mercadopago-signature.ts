import { createHmac, timingSafeEqual } from "node:crypto";

export type MercadoPagoSignatureInput = {
  /** cabeçalho `x-signature`: "ts=1700000000,v1=<hex>" */
  xSignature: string | null;
  /** cabeçalho `x-request-id` */
  xRequestId: string | null;
  /** `data.id` da query string da notificação */
  dataId: string | null;
};

/** Manifesto assinado pelo Mercado Pago: "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" (id alfanumérico em minúsculas). */
export function buildManifest(dataId: string, requestId: string, ts: string): string {
  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  return `id:${id};request-id:${requestId};ts:${ts};`;
}

function parseSignature(header: string): { ts: string; v1: string } | null {
  const parts = Object.fromEntries(
    header.split(",").map((chunk) => {
      const [key, ...rest] = chunk.trim().split("=");
      return [key, rest.join("=")];
    })
  );
  return parts.ts && parts.v1 ? { ts: parts.ts, v1: parts.v1 } : null;
}

/** Valida a assinatura HMAC-SHA256 do webhook com o segredo da aplicação. */
export function isValidMercadoPagoSignature(secret: string, input: MercadoPagoSignatureInput): boolean {
  if (!input.xSignature || !input.xRequestId || !input.dataId) return false;
  const parsed = parseSignature(input.xSignature);
  if (!parsed) return false;

  const expected = createHmac("sha256", secret).update(buildManifest(input.dataId, input.xRequestId, parsed.ts)).digest();
  const received = Buffer.from(parsed.v1, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}
