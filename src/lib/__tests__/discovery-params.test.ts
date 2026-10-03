import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDiscoveryQuery, localizedPath, parseDiscoveryParams } from "../discovery-params.ts";

describe("parseDiscoveryParams", () => {
  it("usa padrões seguros quando a URL vem vazia", () => {
    const { filters, view } = parseDiscoveryParams({});
    assert.equal(filters.q, "");
    assert.equal(filters.sort, "relevance");
    assert.equal(filters.page, 1);
    assert.equal(filters.verified, false);
    assert.equal(view, "grid");
  });

  it("ignora ordenação, página e visão inválidas", () => {
    const { filters, view } = parseDiscoveryParams({ sort: "drop table", page: "-3", view: "lixo" });
    assert.equal(filters.sort, "relevance");
    assert.equal(filters.page, 1);
    assert.equal(view, "grid");
  });

  it("lê filtros válidos e limita o tamanho da busca", () => {
    const { filters, view } = parseDiscoveryParams({
      q: "x".repeat(300),
      cat: "saude-e-estetica",
      sub: "dentistas",
      verified: "1",
      presencial: "1",
      sort: "alpha",
      page: "3",
      view: "list",
    });
    assert.equal(filters.q.length, 100);
    assert.equal(filters.cat, "saude-e-estetica");
    assert.equal(filters.sub, "dentistas");
    assert.equal(filters.verified, true);
    assert.equal(filters.inPerson, true);
    assert.equal(filters.online, false);
    assert.equal(filters.sort, "alpha");
    assert.equal(filters.page, 3);
    assert.equal(view, "list");
  });

  it("aceita parâmetro repetido (usa o primeiro) e ignora espaços", () => {
    const { filters } = parseDiscoveryParams({ q: ["  dentista ", "outro"] });
    assert.equal(filters.q, "dentista");
  });
});

describe("buildDiscoveryQuery", () => {
  it("só inclui o que tem valor e omite os padrões", () => {
    const { filters, view } = parseDiscoveryParams({});
    assert.equal(buildDiscoveryQuery(filters, view), "");
  });

  it("monta a query e permite remover um parâmetro (chip de filtro)", () => {
    const { filters, view } = parseDiscoveryParams({ q: "dentista", cat: "saude-e-estetica", page: "2" });
    assert.equal(buildDiscoveryQuery(filters, view), "?q=dentista&cat=saude-e-estetica&page=2");
    assert.equal(buildDiscoveryQuery(filters, view, { cat: undefined, page: undefined }), "?q=dentista");
  });

  it("codifica caracteres especiais", () => {
    const { filters, view } = parseDiscoveryParams({ q: "café & bar" });
    assert.equal(buildDiscoveryQuery(filters, view), "?q=caf%C3%A9+%26+bar");
  });
});

describe("localizedPath", () => {
  it("português não leva prefixo; os demais idiomas sim", () => {
    assert.equal(localizedPath("pt", "/empresas"), "/empresas");
    assert.equal(localizedPath("en", "/empresas"), "/en/empresas");
  });
});
