import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatSchedule, isOpenNow, parseSchedule } from "../landing/hours.ts";
import { conversionRate, resolveSectionOrder } from "../landing/sections.ts";
import { serviceWhatsappMessage, whatsappDigits, whatsappUrl } from "../landing/whatsapp.ts";
import { resolveRange, summarizeEvents } from "../landing/metrics.ts";
import { categoryFromReferrer, deviceFromUserAgent, utmCampaignFromSearch } from "../landing/origin.ts";

const SCHEDULE = parseSchedule({
  mon: [["08:00", "20:00"]],
  tue: [["08:00", "20:00"]],
  wed: [["08:00", "20:00"]],
  thu: [["08:00", "20:00"]],
  fri: [["08:00", "20:00"]],
  sat: [["08:00", "14:00"]],
  sun: [],
});

describe("parseSchedule", () => {
  it("aceita o formato válido e rejeita o inválido", () => {
    assert.ok(SCHEDULE);
    assert.equal(parseSchedule(null), null);
    assert.equal(parseSchedule([]), null);
    assert.equal(parseSchedule({ mon: [["25:00", "26:00"]] }), null);
    assert.equal(parseSchedule({ mon: [["10:00", "09:00"]] }), null);
    assert.equal(parseSchedule({ mon: "aberto" }), null);
  });
});

describe("isOpenNow", () => {
  // 2026-10-05 é segunda-feira; São Paulo = UTC-3
  it("aberto dentro da faixa e fechado fora dela", () => {
    assert.equal(isOpenNow(SCHEDULE, new Date("2026-10-05T15:00:00Z")), true); // 12h
    assert.equal(isOpenNow(SCHEDULE, new Date("2026-10-05T23:30:00Z")), false); // 20h30
    assert.equal(isOpenNow(SCHEDULE, new Date("2026-10-05T10:59:00Z")), false); // 7h59
  });
  it("fecha às 20h em ponto e domingo fica fechado", () => {
    assert.equal(isOpenNow(SCHEDULE, new Date("2026-10-05T23:00:00Z")), false);
    assert.equal(isOpenNow(SCHEDULE, new Date("2026-10-11T15:00:00Z")), false);
  });
  it("sábado usa a faixa própria e sem horário estruturado retorna null", () => {
    assert.equal(isOpenNow(SCHEDULE, new Date("2026-10-10T16:00:00Z")), true); // sáb 13h
    assert.equal(isOpenNow(SCHEDULE, new Date("2026-10-10T18:00:00Z")), false); // sáb 15h
    assert.equal(isOpenNow(null), null);
  });
});

describe("formatSchedule", () => {
  it("agrupa dias seguidos e omite os fechados", () => {
    assert.deepEqual(formatSchedule(SCHEDULE), ["Segunda a sexta: 8h às 20h", "Sábado: 8h às 14h"]);
    assert.deepEqual(formatSchedule(parseSchedule({ mon: [["08:30", "12:00"], ["14:00", "18:00"]] })), ["Segunda: 8h30 às 12h e 14h às 18h"]);
    assert.deepEqual(formatSchedule(null), []);
  });
});

describe("resolveSectionOrder", () => {
  it("respeita a ordem escolhida, completa com o padrão e remove desativadas", () => {
    assert.deepEqual(resolveSectionOrder(["faq", "services"], ["gallery", "cta"]), ["faq", "services", "about", "offer", "reviews", "location"]);
  });
  it("ignora chaves desconhecidas e repetidas", () => {
    assert.deepEqual(resolveSectionOrder(["x", "faq", "faq"], []).slice(0, 2), ["faq", "about"]);
  });
});

describe("conversionRate", () => {
  it("calcula ações ÷ visualizações × 100 com uma casa e evita divisão por zero", () => {
    assert.equal(conversionRate(5, 100), 5);
    assert.equal(conversionRate(1, 3), 33.3);
    assert.equal(conversionRate(4, 0), 0);
  });
});

describe("whatsapp", () => {
  it("normaliza o número e monta a mensagem do serviço", () => {
    assert.equal(whatsappDigits("(11) 98765-4321"), "5511987654321");
    assert.equal(whatsappDigits("+55 11 98765-4321"), "5511987654321");
    const url = whatsappUrl("11987654321", serviceWhatsappMessage("Clareamento"));
    assert.ok(url.startsWith("https://wa.me/5511987654321?text="));
    assert.ok(decodeURIComponent(url).includes("gostaria de saber mais sobre Clareamento."));
  });
});

describe("summarizeEvents", () => {
  const at = (iso: string) => iso;
  const rows = [
    { event_type: "commercial_page_viewed", metadata: { source: "instagram" }, created_at: at("2026-10-05T15:00:00Z") },
    { event_type: "commercial_page_viewed", metadata: null, created_at: at("2026-10-05T16:00:00Z") },
    { event_type: "commercial_page_viewed", metadata: { source: "instagram" }, created_at: at("2026-10-06T02:00:00Z") },
    { event_type: "commercial_page_viewed", metadata: { source: "google.com" }, created_at: at("2026-10-06T15:00:00Z") },
    { event_type: "whatsapp_clicked", metadata: null, created_at: at("2026-10-05T15:01:00Z") },
    { event_type: "phone_clicked", metadata: null, created_at: at("2026-10-05T15:02:00Z") },
    { event_type: "lead_submitted", metadata: null, created_at: at("2026-10-05T15:03:00Z") },
    { event_type: "service_clicked", metadata: { itemId: "a" }, created_at: at("2026-10-05T15:04:00Z") },
    { event_type: "service_clicked", metadata: { itemId: "a" }, created_at: at("2026-10-05T15:05:00Z") },
    { event_type: "service_clicked", metadata: { itemId: "b" }, created_at: at("2026-10-05T15:06:00Z") },
  ];

  it("conta eventos, calcula a conversão e ranqueia serviços e origens", () => {
    const summary = summarizeEvents(rows);
    assert.equal(summary.views, 4);
    assert.equal(summary.contactActions, 3);
    assert.equal(summary.conversionRate, 75);
    assert.deepEqual(summary.topServiceIds, [{ id: "a", count: 2 }, { id: "b", count: 1 }]);
    assert.deepEqual(summary.sources[0], { source: "instagram", count: 2 });
    assert.ok(summary.sources.some((s) => s.source === "direto"));
  });

  it("agrupa as visitas por dia no fuso de São Paulo", () => {
    // 02h UTC de 06/10 ainda é 23h de 05/10 em São Paulo
    assert.deepEqual(summarizeEvents(rows).viewsByDay, [{ day: "2026-10-05", count: 3 }, { day: "2026-10-06", count: 1 }]);
  });

  it("sem eventos tudo zera e a conversão não divide por zero", () => {
    const empty = summarizeEvents([]);
    assert.equal(empty.views, 0);
    assert.equal(empty.conversionRate, 0);
  });
});

describe("resolveRange", () => {
  // 2026-10-06 14:00 em São Paulo
  const now = new Date("2026-10-06T17:00:00Z");

  it("hoje começa à meia-noite de São Paulo e vai até a meia-noite seguinte", () => {
    assert.deepEqual(resolveRange("today", undefined, now), { from: "2026-10-06T03:00:00.000Z", to: "2026-10-07T03:00:00.000Z" });
  });

  it("7 dias inclui hoje (7 dias de calendário)", () => {
    const range = resolveRange("7d", undefined, now);
    assert.equal(range?.from, "2026-09-30T03:00:00.000Z");
    assert.equal(range?.to, "2026-10-07T03:00:00.000Z");
  });

  it("personalizado é inclusivo e rejeita datas inválidas, invertidas ou longas demais", () => {
    assert.deepEqual(resolveRange("custom", { from: "2026-10-01", to: "2026-10-02" }, now), { from: "2026-10-01T03:00:00.000Z", to: "2026-10-03T03:00:00.000Z" });
    assert.equal(resolveRange("custom", { from: "2026-10-05", to: "2026-10-01" }, now), null);
    assert.equal(resolveRange("custom", { from: "x", to: "2026-10-01" }, now), null);
    assert.equal(resolveRange("custom", { from: "2024-01-01", to: "2026-10-01" }, now), null);
    assert.equal(resolveRange("custom", undefined, now), null);
  });
});

describe("origem da visita", () => {
  it("extrai a categoria do referrer interno e ignora o que vem de fora", () => {
    assert.equal(categoryFromReferrer("https://ceramicahub.com.br/categoria/saude-e-estetica", "ceramicahub.com.br"), "saude-e-estetica");
    assert.equal(categoryFromReferrer("https://www.ceramicahub.com.br/en/categoria/alimentacao/padarias?x=1", "ceramicahub.com.br"), "alimentacao");
    assert.equal(categoryFromReferrer("https://google.com/categoria/saude", "ceramicahub.com.br"), null);
    assert.equal(categoryFromReferrer("https://ceramicahub.com.br/empresas", "ceramicahub.com.br"), null);
    assert.equal(categoryFromReferrer("", "ceramicahub.com.br"), null);
  });

  it("lê a campanha e o dispositivo", () => {
    assert.equal(utmCampaignFromSearch("?utm_source=ig&utm_campaign=Lancamento-Out"), "lancamento-out");
    assert.equal(utmCampaignFromSearch(""), "");
    assert.equal(deviceFromUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile/15E148"), "mobile");
    assert.equal(deviceFromUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"), "desktop");
    assert.equal(deviceFromUserAgent(null), "desktop");
  });
});
