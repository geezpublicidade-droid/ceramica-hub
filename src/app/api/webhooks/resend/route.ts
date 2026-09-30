import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { applyProviderEvent } from "@/lib/services/email-marketing";

const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60;

/** Verifica a assinatura Svix que o Resend anexa a cada webhook:
 * HMAC-SHA256 de `${id}.${timestamp}.${corpo}` com a chave `whsec_...`. */
function isValidSignature(request: Request, body: string, secret: string): boolean {
  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signatures = request.headers.get("svix-signature");
  if (!id || !timestamp || !signatures) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > TIMESTAMP_TOLERANCE_SECONDS) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest();

  return signatures.split(" ").some((entry) => {
    const [, value] = entry.split(",");
    if (!value) return false;
    const received = Buffer.from(value, "base64");
    return received.length === expected.length && timingSafeEqual(received, expected);
  });
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook não configurado." }, { status: 503 });

  const body = await request.text();
  if (!isValidSignature(request, body, secret)) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  try {
    const event = JSON.parse(body) as { type?: string; data?: { email_id?: string } };
    if (event.type && event.data?.email_id) await applyProviderEvent(event.type, event.data.email_id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[webhook/resend]", error);
    return NextResponse.json({ error: "Falha ao processar." }, { status: 500 });
  }
}
