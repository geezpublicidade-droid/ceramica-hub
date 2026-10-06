import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatSchedule, isOpenNow, parseSchedule } from "../landing/hours.ts";
import { conversionRate, resolveSectionOrder } from "../landing/sections.ts";
import { serviceWhatsappMessage, whatsappDigits, whatsappUrl } from "../landing/whatsapp.ts";

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
