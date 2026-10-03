import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeLiveState, daysBetween, pickWeighted, todaySaoPaulo } from "../placement-rules.ts";

const base = { status: "active", payment_status: "paid", starts_at: "2026-10-01", ends_at: "2026-12-31" } as const;

describe("computeLiveState", () => {
  it("posição ativa, paga e dentro do período está no ar", () => {
    assert.equal(computeLiveState(base, "2026-10-15"), "no_ar");
  });

  it("avisa que vence em até 7 dias", () => {
    assert.equal(computeLiveState({ ...base, ends_at: "2026-10-20" }, "2026-10-15"), "vencendo");
    assert.equal(computeLiveState({ ...base, ends_at: "2026-10-23" }, "2026-10-15"), "no_ar");
  });

  it("sem pagamento confirmado não vai ao ar, mesmo ativa", () => {
    assert.equal(computeLiveState({ ...base, payment_status: "pending" }, "2026-10-15"), "aguardando");
    assert.equal(computeLiveState({ ...base, payment_status: "overdue" }, "2026-10-15"), "aguardando");
  });

  it("isenta conta como paga", () => {
    assert.equal(computeLiveState({ ...base, payment_status: "waived" }, "2026-10-15"), "no_ar");
  });

  it("antes do início fica agendada; depois do término, encerrada", () => {
    assert.equal(computeLiveState(base, "2026-09-20"), "agendada");
    assert.equal(computeLiveState(base, "2027-01-01"), "encerrada");
  });

  it("o último dia do contrato ainda vale", () => {
    assert.equal(computeLiveState({ ...base, ends_at: "2026-10-15" }, "2026-10-15"), "vencendo");
  });

  it("reservada espera liberação; suspensa e cancelada não aparecem", () => {
    assert.equal(computeLiveState({ ...base, status: "reserved" }, "2026-10-15"), "aguardando");
    assert.equal(computeLiveState({ ...base, status: "paused" }, "2026-10-15"), "suspensa");
    assert.equal(computeLiveState({ ...base, status: "cancelled" }, "2026-10-15"), "encerrada");
  });
});

describe("daysBetween / todaySaoPaulo", () => {
  it("conta dias inteiros, também entre meses e anos", () => {
    assert.equal(daysBetween("2026-10-15", "2026-10-15"), 0);
    assert.equal(daysBetween("2026-10-30", "2026-11-02"), 3);
    assert.equal(daysBetween("2026-12-30", "2027-01-02"), 3);
    assert.equal(daysBetween("2026-10-20", "2026-10-15"), -5);
  });

  it("usa o dia de São Paulo, não o de UTC (02:00 UTC ainda é o dia anterior no Brasil)", () => {
    assert.equal(todaySaoPaulo(new Date("2026-10-16T02:00:00Z")), "2026-10-15");
    assert.equal(todaySaoPaulo(new Date("2026-10-16T03:30:00Z")), "2026-10-16");
  });
});

describe("pickWeighted", () => {
  const items = [
    { id: "a", rotation_weight: 1, position: 2 },
    { id: "b", rotation_weight: 1, position: 0 },
    { id: "c", rotation_weight: 1, position: 1 },
  ];

  it("com anunciantes dentro do limite, mostra todos na ordem manual", () => {
    assert.deepEqual(pickWeighted(items, 3).map((i) => i.id), ["b", "c", "a"]);
    assert.deepEqual(pickWeighted(items, 5).map((i) => i.id), ["b", "c", "a"]);
  });

  it("com excesso, devolve só o limite, sem repetir ninguém", () => {
    for (let run = 0; run < 50; run += 1) {
      const picked = pickWeighted(items, 2).map((i) => i.id);
      assert.equal(picked.length, 2);
      assert.equal(new Set(picked).size, 2);
    }
  });

  it("peso maior aparece mais, e peso menor ainda aparece (rotação equilibrada)", () => {
    const weighted = [
      { id: "heavy", rotation_weight: 9, position: 0 },
      { id: "light", rotation_weight: 1, position: 1 },
    ];
    let heavy = 0;
    let light = 0;
    for (let run = 0; run < 2000; run += 1) {
      const [first] = pickWeighted(weighted, 1);
      if (first.id === "heavy") heavy += 1;
      else light += 1;
    }
    assert.ok(heavy > light * 4, `esperava heavy bem acima de light, veio ${heavy} x ${light}`);
    assert.ok(light > 0, "a empresa de peso baixo nunca pode ficar totalmente de fora");
  });

  it("não altera a lista original", () => {
    const copy = items.map((i) => ({ ...i }));
    pickWeighted(items, 1);
    assert.deepEqual(items, copy);
  });
});
