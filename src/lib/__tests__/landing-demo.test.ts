import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyDemoContent, familyFor, pickDemoImages, DEMO_STOCK_IMAGES } from "../landing/demo.ts";
import { landingCapabilitiesFor } from "../landing/sections.ts";

type Plan = "presenca" | "profissional" | "destaque" | "experiencia" | "premium";

function emptyData(plan: Plan) {
  return {
    config: {
      status: "published", heroHeadline: null, heroSubtitle: null, heroImageUrl: null, heroCtaKind: "servicos", heroCtaLabel: null,
      whatsappPhone: null, whatsappMessage: null, aboutProblem: null, aboutBenefit: null, aboutDifferentials: [], aboutAudience: null,
      yearsInBusiness: null, responseTime: null, byAppointment: false, professionalRegistry: null, parkingInfo: null, accessibilityInfo: null,
      referencePoint: null, openingSchedule: null, facebookUrl: null, tiktokUrl: null, youtubeUrl: null, leadFormEnabled: false,
      finalCtaTitle: null, finalCtaText: null, finalCtaLabel: null, sectionOrder: [], sectionsDisabled: [], seoTitle: null, seoDescription: null,
    },
    capabilities: landingCapabilitiesFor(plan),
    sections: [],
    services: [],
    hasMoreServices: false,
    faqs: [],
    offer: null,
    gallery: [],
    videos: [],
    reviews: [],
    reviewStats: { average: 0, count: 0 },
  };
}

const business = (category: string) => ({ id: "b1", name: "Empresa", category, coverPhoto: undefined }) as never;

describe("familyFor", () => {
  it("classifica as categorias do Hub", () => {
    assert.equal(familyFor("Saúde & Estética"), "saude");
    assert.equal(familyFor("Tecnologia & Marketing"), "tecnologia");
    assert.equal(familyFor("Alimentação"), "alimentacao");
    assert.equal(familyFor("Contabilidade & Jurídico"), "profissional");
    assert.equal(familyFor("Educação"), "educacao");
    assert.equal(familyFor("Outros"), "generico");
  });
});

describe("pickDemoImages", () => {
  it("repete as imagens da empresa em ciclo e cai nas do Hub quando não há nenhuma", () => {
    assert.deepEqual(pickDemoImages(["a", "b"], 5), ["a", "b", "a", "b", "a"]);
    assert.deepEqual(pickDemoImages([], 2), [DEMO_STOCK_IMAGES[0], DEMO_STOCK_IMAGES[1]]);
  });
});

describe("applyDemoContent respeita o plano simulado", () => {
  it("Premium: completa tudo (FAQ, oferta, galeria, formulário, avaliações, capa)", () => {
    const out = applyDemoContent(emptyData("premium") as never, { business: business("Saúde & Estética"), ownImages: ["capa.jpg"] });
    assert.ok(out.faqs.length >= 4);
    assert.ok(out.offer);
    assert.ok(out.gallery.length > 0);
    assert.equal(out.gallery[0].url, "capa.jpg");
    assert.equal(out.config.leadFormEnabled, true);
    assert.equal(out.config.heroImageUrl, "capa.jpg");
    assert.ok(out.reviews.length > 0 && out.reviewStats.count === out.reviews.length);
    assert.ok(out.services.length > 0);
  });

  it("Gratuito: sem FAQ, oferta, galeria, formulário nem capa personalizada", () => {
    const out = applyDemoContent(emptyData("presenca") as never, { business: business("Saúde & Estética"), ownImages: ["capa.jpg"] });
    assert.equal(out.faqs.length, 0);
    assert.equal(out.offer, null);
    assert.equal(out.gallery.length, 0);
    assert.equal(out.config.leadFormEnabled, false);
    assert.equal(out.config.heroImageUrl, null);
  });

  it("Profissional (perfil padronizado): galeria e 1 promoção sim; FAQ, formulário e capa personalizada não", () => {
    const out = applyDemoContent(emptyData("profissional") as never, { business: business("Alimentação"), ownImages: [] });
    assert.ok(out.gallery.length > 0);
    assert.ok(out.offer);
    assert.equal(out.faqs.length, 0);
    assert.equal(out.config.leadFormEnabled, false);
    assert.equal(out.config.heroImageUrl, null);
  });

  it("conteúdo real nunca é sobrescrito", () => {
    const data = emptyData("premium") as unknown as { config: Record<string, unknown>; faqs: unknown[] };
    data.config.heroHeadline = "Meu título";
    data.faqs = [{ id: "x", question: "Real?", answer: "Sim" }];
    const out = applyDemoContent(data as never, { business: business("Outros"), ownImages: [] });
    assert.equal(out.config.heroHeadline, "Meu título");
    assert.equal(out.faqs.length, 1);
    assert.equal(out.faqs[0].question, "Real?");
  });
});

describe("grade de serviços da simulação", () => {
  it("completa até 4 cards sem repetir o serviço real e respeita o limite do plano", () => {
    const data = emptyData("premium") as unknown as { services: { id: string; name: string }[] };
    data.services = [{ id: "real", name: "Avaliação inicial" }];
    const out = applyDemoContent(data as never, { business: business("Saúde & Estética"), ownImages: [] });
    assert.equal(out.services.length, 4);
    assert.equal(out.services.filter((s) => s.name.toLowerCase() === "avaliação inicial").length, 1);
    assert.equal(out.services[0].id, "real");
  });

  it("plano gratuito (limite 0) continua sem serviços", () => {
    const out = applyDemoContent(emptyData("presenca") as never, { business: business("Saúde & Estética"), ownImages: [] });
    assert.equal(out.services.length, 0);
  });
});
