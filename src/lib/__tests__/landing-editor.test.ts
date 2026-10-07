import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { brandingSchema, brandingToRow, checkBrandingAgainstPlan, checkPatchAgainstPlan, landingPatchSchema, patchToRow } from "../landing/editor-schema.ts";
import { landingCapabilitiesFor } from "../landing/sections.ts";

describe("landingPatchSchema", () => {
  it("aceita um salvamento parcial e normaliza vazios para null", () => {
    const parsed = landingPatchSchema.parse({ heroHeadline: "  Sorriso cuidado  ", heroSubtitle: "   " });
    assert.equal(parsed.heroHeadline, "Sorriso cuidado");
    assert.equal(parsed.heroSubtitle, null);
    assert.equal(parsed.aboutProblem, undefined);
  });

  it("só aceita links https", () => {
    assert.equal(landingPatchSchema.safeParse({ facebookUrl: "javascript:alert(1)" }).success, false);
    assert.equal(landingPatchSchema.safeParse({ facebookUrl: "http://exemplo.com" }).success, false);
    assert.equal(landingPatchSchema.parse({ facebookUrl: "https://facebook.com/x" }).facebookUrl, "https://facebook.com/x");
    assert.equal(landingPatchSchema.parse({ facebookUrl: "" }).facebookUrl, null);
  });

  it("limita tamanhos e quantidade de diferenciais", () => {
    assert.equal(landingPatchSchema.safeParse({ heroHeadline: "x".repeat(121) }).success, false);
    assert.equal(landingPatchSchema.safeParse({ aboutDifferentials: ["a", "b", "c", "d", "e", "f", "g"] }).success, false);
  });

  it("normaliza o WhatsApp para dígitos e rejeita número curto", () => {
    assert.equal(landingPatchSchema.parse({ whatsappPhone: "(11) 98765-4321" }).whatsappPhone, "11987654321");
    assert.equal(landingPatchSchema.safeParse({ whatsappPhone: "1234" }).success, false);
  });

  it("valida o horário estruturado", () => {
    assert.ok(landingPatchSchema.parse({ openingSchedule: { mon: [["08:00", "18:00"]] } }).openingSchedule);
    assert.equal(landingPatchSchema.safeParse({ openingSchedule: { mon: [["18:00", "08:00"]] } }).success, false);
    assert.equal(landingPatchSchema.parse({ openingSchedule: null }).openingSchedule, null);
  });

  it("rejeita seção desconhecida na ordem", () => {
    assert.equal(landingPatchSchema.safeParse({ sectionOrder: ["faq", "inexistente"] }).success, false);
  });
});

describe("patchToRow", () => {
  it("mapeia só os campos enviados para colunas", () => {
    assert.deepEqual(patchToRow({ heroHeadline: "Oi", leadFormEnabled: true, heroSubtitle: null }), {
      hero_headline: "Oi",
      lead_form_enabled: true,
      hero_subtitle: null,
    });
    assert.deepEqual(patchToRow({}), {});
  });
});

describe("checkPatchAgainstPlan", () => {
  const free = landingCapabilitiesFor("presenca");
  const pro = landingCapabilitiesFor("profissional");
  const exp = landingCapabilitiesFor("experiencia");

  it("hero, seções, CTAs e formulário só do Experiência para cima", () => {
    assert.ok(checkPatchAgainstPlan({ heroImageUrl: "https://x.com/a.jpg" }, pro));
    assert.ok(checkPatchAgainstPlan({ heroHeadline: "Oi" }, landingCapabilitiesFor("destaque")));
    assert.ok(checkPatchAgainstPlan({ aboutProblem: "x" }, pro));
    assert.ok(checkPatchAgainstPlan({ finalCtaTitle: "x" }, pro));
    assert.ok(checkPatchAgainstPlan({ leadFormEnabled: true }, landingCapabilitiesFor("destaque")));
    assert.equal(checkPatchAgainstPlan({ heroHeadline: "Oi", aboutProblem: "x", finalCtaTitle: "t", leadFormEnabled: true }, exp), null);
  });

  it("WhatsApp, redes, horário e informações comerciais a partir do Profissional", () => {
    assert.ok(checkPatchAgainstPlan({ whatsappPhone: "11987654321" }, free));
    assert.ok(checkPatchAgainstPlan({ facebookUrl: "https://facebook.com/x" }, free));
    assert.ok(checkPatchAgainstPlan({ openingSchedule: { mon: [["09:00", "18:00"]] } }, free));
    assert.ok(checkPatchAgainstPlan({ parkingInfo: "x" }, free));
    assert.equal(checkPatchAgainstPlan({ whatsappPhone: "11987654321", facebookUrl: "https://facebook.com/x", openingSchedule: { mon: [["09:00", "18:00"]] }, parkingInfo: "x" }, pro), null);
  });

  it("desligar recurso ou salvar vazio nunca é bloqueado", () => {
    assert.equal(checkPatchAgainstPlan({ leadFormEnabled: false }, free), null);
    assert.equal(checkPatchAgainstPlan({}, free), null);
  });
});

describe("identidade da empresa (branding)", () => {
  it("valida e mapeia para as colunas de businesses", () => {
    const parsed = brandingSchema.parse({ description: "  Texto  ", logoUrl: "https://x.com/l.png", coverPhotoUrl: "", instagram: "@duavesso" });
    assert.deepEqual(brandingToRow(parsed), { description: "Texto", logo_url: "https://x.com/l.png", cover_photo_url: null, instagram: "@duavesso" });
    assert.equal(brandingSchema.safeParse({ logoUrl: "javascript:alert(1)" }).success, false);
    assert.equal(brandingSchema.safeParse({ description: "x".repeat(601) }).success, false);
  });

  it("capa, descrição, redes e site a partir do Profissional; logo e remoção sempre livres", () => {
    const free = landingCapabilitiesFor("presenca");
    const pro = landingCapabilitiesFor("profissional");
    assert.ok(checkBrandingAgainstPlan({ coverPhotoUrl: "https://x.com/c.jpg" }, free));
    assert.ok(checkBrandingAgainstPlan({ description: "texto" }, free));
    assert.ok(checkBrandingAgainstPlan({ instagram: "@x" }, free));
    assert.equal(checkBrandingAgainstPlan({ coverPhotoUrl: "https://x.com/c.jpg", description: "texto", instagram: "@x" }, pro), null);
    assert.equal(checkBrandingAgainstPlan({ coverPhotoUrl: null, description: null }, free), null);
    assert.equal(checkBrandingAgainstPlan({ logoUrl: "https://x.com/l.png" }, free), null);
  });
});
