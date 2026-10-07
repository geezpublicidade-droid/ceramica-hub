import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PLAN_FEATURES } from "../plans/features.ts";
import { listingBadge, rankCompanies, rankingTier, rotateWithin, stableHash, ROTATION_WINDOW_MS } from "../plans/ranking.ts";
import { resolveFeatures } from "../plans/resolve.ts";

const F = DEFAULT_PLAN_FEATURES;
const at = (hours: number) => new Date(Date.UTC(2026, 9, 7, 12) + hours * ROTATION_WINDOW_MS);

describe("rankingTier", () => {
  it("segue Premium > Experiência > Destaque > Profissional > Gratuito", () => {
    const tiers = (["premium", "experiencia", "destaque", "profissional", "presenca"] as const).map((plan) => rankingTier(F[plan], "category"));
    assert.deepEqual(tiers, [...tiers].sort((a, b) => b - a));
    assert.equal(new Set(tiers).size, 5);
  });

  it("patrocinador em campanha fica acima de todos; sem campanha fica no nível da base", () => {
    const sponsor = resolveFeatures(F.patrocinador, "patrocinador", [{ featureKey: "sponsor_top_priority", value: true }]);
    assert.ok(rankingTier(sponsor, "search") > rankingTier(F.premium, "search"));
    assert.ok(rankingTier(F.patrocinador, "search") <= rankingTier(F.premium, "search"));
  });

  it("sem prioridade de busca/categoria a empresa fica no máximo no nível do Profissional", () => {
    const off = resolveFeatures(F.destaque, "destaque", [{ featureKey: "search_priority", value: false }, { featureKey: "category_priority", value: false }]);
    assert.equal(rankingTier(off, "search"), 1);
    assert.equal(rankingTier(off, "category"), 1);
    assert.equal(rankingTier(F.destaque, "search"), 2);
  });
});

describe("rotateWithin (rodízio equilibrado)", () => {
  const items = ["a", "b", "c", "d"].map((id) => ({ id }));

  it("é determinístico na mesma janela e gira uma posição a cada janela", () => {
    const first = rotateWithin(items, (i) => i.id, { context: "cat", now: at(0) }).map((i) => i.id);
    assert.deepEqual(first, rotateWithin(items, (i) => i.id, { context: "cat", now: at(0) }).map((i) => i.id));
    const next = rotateWithin(items, (i) => i.id, { context: "cat", now: at(1) }).map((i) => i.id);
    assert.equal(next[0], first[1]);
    assert.equal(next.length, 4);
  });

  it("cada empresa passa pela primeira posição exatamente uma vez a cada N janelas", () => {
    const firsts = Array.from({ length: items.length }, (_, hour) => rotateWithin(items, (i) => i.id, { context: "busca", now: at(hour) })[0].id);
    assert.equal(new Set(firsts).size, items.length);
  });

  it("o contexto desloca a rotação (categorias diferentes não giram em sincronia)", () => {
    const hashes = new Set(["saude", "alimentacao", "educacao", "tecnologia", "outros", "beleza"].map((c) => stableHash(c) % 4));
    assert.ok(hashes.size > 1);
  });

  it("lista com 0 ou 1 item volta igual", () => {
    assert.deepEqual(rotateWithin([], (i: { id: string }) => i.id, { context: "x" }), []);
    assert.deepEqual(rotateWithin([{ id: "z" }], (i) => i.id, { context: "x" }), [{ id: "z" }]);
  });
});

describe("rankCompanies", () => {
  const list = [
    { id: "free-1", tier: 0 }, { id: "pro-1", tier: 1 }, { id: "dest-1", tier: 2 }, { id: "dest-2", tier: 2 },
    { id: "prem-1", tier: 4 }, { id: "prem-2", tier: 4 }, { id: "free-2", tier: 0 },
  ];

  it("nunca coloca nível menor antes de nível maior", () => {
    for (let hour = 0; hour < 6; hour += 1) {
      const tiers = rankCompanies(list, { context: "home", now: at(hour) }).map((i) => i.tier);
      assert.deepEqual(tiers, [...tiers].sort((a, b) => b - a));
    }
  });

  it("Premium não ocupa a primeira posição para sempre: revezam", () => {
    const leaders = new Set(Array.from({ length: 4 }, (_, hour) => rankCompanies(list, { context: "home", now: at(hour) })[0].id));
    assert.equal(leaders.size, 2);
    assert.ok(leaders.has("prem-1") && leaders.has("prem-2"));
  });

  it("relevância textual vem antes do plano", () => {
    const withRelevance = [{ id: "pro", tier: 1, relevance: 0 }, { id: "prem", tier: 4, relevance: 3 }];
    assert.equal(rankCompanies(withRelevance, { context: "search", now: at(0) })[0].id, "pro");
  });
});

describe("listingBadge", () => {
  it("escolhe o selo mais alto liberado e nenhum no gratuito", () => {
    assert.equal(listingBadge(F.presenca), null);
    assert.equal(listingBadge(F.profissional), "sponsored");
    assert.equal(listingBadge(F.destaque), "featured");
    assert.equal(listingBadge(F.premium), "premium");
  });
});
