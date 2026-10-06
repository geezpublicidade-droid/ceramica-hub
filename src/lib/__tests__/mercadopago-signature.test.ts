import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { buildManifest, isValidMercadoPagoSignature } from "../mercadopago-signature.ts";
import { clientIpFrom, rateLimitKey } from "../rate-limit-key.ts";

const SECRET = "segredo-de-teste";

function sign(dataId: string, requestId: string, ts: string, secret = SECRET): string {
  const v1 = createHmac("sha256", secret).update(buildManifest(dataId, requestId, ts)).digest("hex");
  return `ts=${ts},v1=${v1}`;
}

test("manifesto usa id alfanumérico em minúsculas", () => {
  assert.equal(buildManifest("ABC123", "req-1", "1700000000"), "id:abc123;request-id:req-1;ts:1700000000;");
  assert.equal(buildManifest("123456", "req-1", "1700000000"), "id:123456;request-id:req-1;ts:1700000000;");
});

test("assinatura válida passa", () => {
  const xSignature = sign("123456", "req-1", "1700000000");
  assert.equal(isValidMercadoPagoSignature(SECRET, { xSignature, xRequestId: "req-1", dataId: "123456" }), true);
});

test("segredo errado, id adulterado ou cabeçalho ausente falham", () => {
  const xSignature = sign("123456", "req-1", "1700000000");
  assert.equal(isValidMercadoPagoSignature("outro", { xSignature, xRequestId: "req-1", dataId: "123456" }), false);
  assert.equal(isValidMercadoPagoSignature(SECRET, { xSignature, xRequestId: "req-1", dataId: "999999" }), false);
  assert.equal(isValidMercadoPagoSignature(SECRET, { xSignature, xRequestId: "req-2", dataId: "123456" }), false);
  assert.equal(isValidMercadoPagoSignature(SECRET, { xSignature: null, xRequestId: "req-1", dataId: "123456" }), false);
  assert.equal(isValidMercadoPagoSignature(SECRET, { xSignature: "lixo", xRequestId: "req-1", dataId: "123456" }), false);
  assert.equal(isValidMercadoPagoSignature(SECRET, { xSignature: "ts=1,v1=zz", xRequestId: "req-1", dataId: "123456" }), false);
});

test("IP do cliente vem do primeiro item do x-forwarded-for", () => {
  assert.equal(clientIpFrom("203.0.113.9, 10.0.0.1"), "203.0.113.9");
  assert.equal(clientIpFrom(null), "unknown");
  assert.equal(clientIpFrom(""), "unknown");
  assert.equal(rateLimitKey("search", "203.0.113.9"), "search:203.0.113.9");
});
