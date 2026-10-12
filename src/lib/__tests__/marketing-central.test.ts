import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyDiscount, discountFor, remainingAllowance } from "../ad-plan-benefits.ts";
import { isAllowedWeekday, monthBounds, openSlots, validatePublicationSlot } from "../publication-schedule.ts";
import { buildMonthGrid, buildTimeline, shiftMonth, type AgendaItem } from "../agenda.ts";
import { buildRecommendations, describeChange, percentChange } from "../marketing-recommendations.ts";
import { campaignStage } from "../ad-stage.ts";

describe("benefícios do plano", () => {
  it("aplica desconto e controla o benefício mensal", () => {
    assert.equal(applyDiscount(10000, discountFor("destaque")), 9000);
    assert.equal(discountFor("desconhecido"), 0);
    assert.equal(remainingAllowance("destaque", "story_hub", 3), 1);
    assert.equal(remainingAllowance("destaque", "story_hub", 9), 0);
    assert.equal(remainingAllowance("presenca", "story_hub", 0), 0);
  });
});

describe("publicações", () => {
  const rules = { timeSlots: ["12:00", "19:00"], weekdays: [], capacityPerSlot: 1, leadDays: 3 };
  const today = "2026-10-12";
  it("lista só horários com vaga depois da antecedência", () => {
    const slots = openSlots(rules, [{ scheduledFor: "2026-10-15", timeSlot: "12:00" }], today, 5);
    assert.deepEqual(slots.map((s) => `${s.date} ${s.time}`), ["2026-10-15 19:00", "2026-10-16 12:00", "2026-10-16 19:00"]);
  });
  it("respeita dia da semana (quinta = 4)", () => {
    const weekly = { ...rules, weekdays: [4], timeSlots: ["08:00"] };
    assert.equal(isAllowedWeekday(weekly, "2026-10-15"), true);
    assert.equal(isAllowedWeekday(weekly, "2026-10-16"), false);
    assert.match(validatePublicationSlot(weekly, [], today, "2026-10-16", "08:00") ?? "", /dia da semana/);
    assert.equal(validatePublicationSlot(weekly, [], today, "2026-10-22", "08:00"), null);
  });
  it("recusa horário lotado, inexistente e antecedência", () => {
    const booked = [{ scheduledFor: "2026-10-20", timeSlot: "19:00" }];
    assert.match(validatePublicationSlot(rules, booked, today, "2026-10-20", "19:00") ?? "", /reservado/);
    assert.match(validatePublicationSlot(rules, [], today, "2026-10-20", "10:00") ?? "", /horários/);
    assert.match(validatePublicationSlot(rules, [], today, "2026-10-13", "12:00") ?? "", /antecedência/);
  });
  it("limites do mês", () => {
    assert.deepEqual(monthBounds("2026-12-20"), { from: "2026-12-01", to: "2027-01-01" });
  });
});

describe("agenda", () => {
  const items: AgendaItem[] = [
    { id: "a", kind: "anuncio", title: "Banner", date: "2026-10-18", endDate: "2026-10-24", tone: "blue" },
    { id: "b", kind: "publicacao", title: "Story", date: "2026-10-12", time: "19:00", tone: "green" },
  ];
  it("monta a grade do mês com os itens nos dias certos", () => {
    const grid = buildMonthGrid("2026-10", items);
    const cells = grid.flat();
    assert.equal(cells.find((c) => c.date === "2026-10-20")?.items[0]?.id, "a");
    assert.equal(cells.find((c) => c.date === "2026-10-25")?.items.length, 0);
    assert.equal(grid.every((week) => week.length === 7), true);
  });
  it("linha do tempo separa hoje e próximos dias", () => {
    const timeline = buildTimeline(items, "2026-10-12");
    assert.deepEqual(timeline.today.map((i) => i.id), ["b"]);
    assert.deepEqual(timeline.upcoming.map((i) => i.id), ["a"]);
    assert.equal(shiftMonth("2026-12", 1), "2027-01");
  });
});

describe("recomendações e variação", () => {
  const base = { plan: "destaque", photoCount: 8, hasActivePromotion: true, promotionEndsInDays: null, campaignEndsInDays: null, openSpace: null, peak: null, unansweredLeads: 0, hasNoCampaignScheduled: false };
  it("prioriza lead sem resposta e promoção acabando", () => {
    const list = buildRecommendations({ ...base, unansweredLeads: 2, promotionEndsInDays: 2, photoCount: 2 });
    assert.deepEqual(list.map((r) => r.id), ["leads", "promo-ending", "photos"]);
    assert.deepEqual(buildRecommendations(base), []);
  });
  it("variação percentual só com base de comparação", () => {
    assert.equal(percentChange(128, 100), 28);
    assert.equal(percentChange(5, 0), null);
    assert.match(describeChange("visualizações", 28) ?? "", /28% mais visualizações/);
    assert.equal(describeChange("visualizações", null), null);
  });
  it("fase da campanha para a empresa", () => {
    const stage = (status: string, paymentStatus: string, s: string, e: string) => campaignStage({ status, paymentStatus, startsAt: s, endsAt: e }, "2026-10-12").label;
    assert.equal(stage("approved", "pago", "2026-10-10", "2026-10-20"), "No ar");
    assert.equal(stage("approved", "pago", "2026-10-15", "2026-10-20"), "Agendada");
    assert.equal(stage("pending_review", "pendente", "2026-10-15", "2026-10-20"), "Aguardando pagamento");
    assert.equal(stage("rejected", "pago", "2026-10-15", "2026-10-20"), "Precisa de correção");
  });
});
