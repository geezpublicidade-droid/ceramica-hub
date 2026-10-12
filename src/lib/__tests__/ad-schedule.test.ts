import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addDays, countDays, firstAvailableStart, isRangeAvailable, occupancyByDay, priceForPeriod, validatePeriod } from "../ad-schedule.ts";

describe("datas", () => {
  it("conta dias incluindo início e fim e soma dias", () => {
    assert.equal(countDays("2026-10-12", "2026-10-12"), 1);
    assert.equal(countDays("2026-10-12", "2026-10-18"), 7);
    assert.equal(addDays("2026-10-30", 3), "2026-11-02");
  });
});

describe("ocupação e disponibilidade", () => {
  const bookings = [{ startsAt: "2026-10-15", endsAt: "2026-10-20" }];
  it("espaço de 1 vaga fica cheio dentro do período reservado", () => {
    const days = occupancyByDay(bookings, 1, "2026-10-14", 8);
    assert.deepEqual(days.map((d) => d.free), [1, 0, 0, 0, 0, 0, 0, 1]);
  });
  it("capacidade maior mantém vaga livre", () => {
    assert.equal(isRangeAvailable(bookings, 2, "2026-10-15", "2026-10-20"), true);
    assert.equal(isRangeAvailable(bookings, 1, "2026-10-10", "2026-10-15"), false);
    assert.equal(isRangeAvailable(bookings, 1, "2026-10-21", "2026-10-27"), true);
  });
  it("acha a primeira data em que o período cabe", () => {
    assert.equal(firstAvailableStart(bookings, 1, "2026-10-14", 7), "2026-10-21");
    assert.equal(firstAvailableStart([], 1, "2026-10-14", 7), "2026-10-14");
  });
});

describe("preço e regras", () => {
  it("preço proporcional arredonda pra cima", () => {
    assert.equal(priceForPeriod(300000, 30), 300000);
    assert.equal(priceForPeriod(400000, 7), 93334);
  });
  const rules = { minDays: 7, maxDays: 60, leadDays: 2 };
  it("valida antecedência, mínimo e máximo", () => {
    assert.match(validatePeriod("2026-10-12", "2026-10-25", "2026-10-12", rules) ?? "", /antecedência/);
    assert.match(validatePeriod("2026-10-14", "2026-10-16", "2026-10-12", rules) ?? "", /mínimo/);
    assert.match(validatePeriod("2026-10-14", "2027-01-30", "2026-10-12", rules) ?? "", /máximo/);
    assert.equal(validatePeriod("2026-10-14", "2026-10-20", "2026-10-12", rules), null);
  });
});

import { checkCreativeSize } from "../ad-creative.ts";

describe("criativo", () => {
  const target = { width: 1200, height: 240 };
  it("aceita a medida exata e variações pequenas", () => {
    assert.equal(checkCreativeSize(1200, 240, target), null);
    assert.equal(checkCreativeSize(1000, 202, target), null);
  });
  it("recusa proporção errada e resolução baixa", () => {
    assert.match(checkCreativeSize(1200, 600, target) ?? "", /Proporção/);
    assert.match(checkCreativeSize(600, 120, target) ?? "", /Resolução/);
  });
});
