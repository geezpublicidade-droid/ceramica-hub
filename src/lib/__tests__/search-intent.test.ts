import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  companyTier,
  levenshtein,
  meaningfulTokens,
  normalizeText,
  parseIntent,
  phraseScore,
  wordScore,
  type CategoryTerm,
} from "../search-intent.ts";

const categories: CategoryTerm[] = [
  { id: "saude", level: 1, path: "saude-e-estetica", label: "Saúde & Estética", forms: ["Saúde & Estética", "saude", "medico"] },
  { id: "dent", level: 2, path: "saude-e-estetica/dentistas", label: "Saúde & Estética › Dentistas", forms: ["Dentistas", "dentista", "odontologia", "dentes"] },
  { id: "impl", level: 3, path: "saude-e-estetica/dentistas/implantes", label: "Saúde & Estética › Dentistas › Implantes", forms: ["Implantes", "implante dentario"] },
  { id: "est", level: 2, path: "saude-e-estetica/estetica", label: "Saúde & Estética › Estética", forms: ["Estética", "esteticista", "limpeza de pele"] },
  { id: "medest", level: 2, path: "saude-e-estetica/medicina-estetica", label: "Saúde & Estética › Medicina estética", forms: ["Medicina estética", "botox"] },
  { id: "dir", level: 1, path: "direito", label: "Direito", forms: ["Direito", "advogado", "advocacia"] },
  { id: "trab", level: 2, path: "direito/advocacia-trabalhista", label: "Direito › Advocacia trabalhista", forms: ["Advocacia trabalhista", "advogado trabalhista", "demissao"] },
  { id: "salao", level: 2, path: "saude-e-estetica/saloes-de-beleza", label: "Saúde & Estética › Salões de beleza", forms: ["Salões de beleza", "salao de beleza", "cabeleireiro"] },
  { id: "cont", level: 2, path: "contabilidade-e-juridico/contabilidade", label: "Contabilidade & Jurídico › Contabilidade", forms: ["Contabilidade", "contador", "imposto de renda"] },
];
const towers = [
  { id: "park", name: "Torre Park" },
  { id: "union", name: "Torre Union" },
];
const context = { categories, towers, floors: ["2", "5", "10"] };

describe("normalizeText / tokens", () => {
  it("remove acentos, símbolos e caixa", () => {
    assert.equal(normalizeText("Saúde & Estética!"), "saude e estetica");
  });
  it("ignora palavras de ligação", () => {
    assert.deepEqual(meaningfulTokens("quero um dentista para a minha empresa"), ["dentista", "minha"]);
  });
});

describe("tolerância a erros", () => {
  it("levenshtein com corte", () => {
    assert.equal(levenshtein("dentista", "dentista", 2), 0);
    assert.equal(levenshtein("dentista", "dentsta", 2), 1);
    assert.ok(levenshtein("dentista", "advogado", 2) > 2);
  });
  it("palavras curtas não aceitam erro (evita falso positivo)", () => {
    assert.equal(wordScore("mei", "mel"), 0);
    assert.equal(wordScore("pet", "pea"), 0);
  });
  it("exata, plural, prefixo e erro de digitação têm notas decrescentes", () => {
    assert.equal(wordScore("dentistas", "dentistas"), 1);
    assert.equal(wordScore("dentista", "dentistas"), 0.95);
    assert.equal(wordScore("odonto", "odontologia"), 0.85);
    assert.equal(wordScore("harmonizaco", "harmonizacao"), 0.6);
  });
  it("todas as palavras precisam casar", () => {
    assert.ok(phraseScore(["implante", "dentario"], "implante dentario") > 0.9);
    assert.equal(phraseScore(["implante", "carro"], "implante dentario"), 0);
  });
});

describe("parseIntent", () => {
  it("reconhece sinônimo e preferência pela categoria mais específica", () => {
    const intent = parseIntent("odontologia", context);
    assert.equal(intent.filters.cat, "saude-e-estetica");
    assert.equal(intent.filters.sub, "dentistas");
    assert.equal(intent.rest, "");
  });

  it("aprofunda para a especialidade quando a frase a cita", () => {
    const intent = parseIntent("dentista implante", context);
    assert.equal(intent.filters.sub, "dentistas");
    assert.equal(intent.filters.spec, "implantes");
    assert.equal(intent.rest, "");
  });

  it("extrai torre, andar e filtros da frase", () => {
    const intent = parseIntent("dentista verificada torre park 5 andar", context);
    assert.equal(intent.filters.towerId, "park");
    assert.equal(intent.filters.floor, "5");
    assert.equal(intent.filters.verified, true);
    assert.equal(intent.filters.sub, "dentistas");
    assert.deepEqual(intent.chips.map((chip) => chip.kind).sort(), ["andar", "categoria", "filtro", "torre"]);
  });

  it("ignora andar que não existe no prédio", () => {
    const intent = parseIntent("dentista 99 andar", context);
    assert.equal(intent.filters.floor, undefined);
  });

  it("entende erro de digitação em palavra longa", () => {
    assert.equal(parseIntent("contabilidde", context).filters.sub, "contabilidade");
  });

  it("prefere a categoria que casa mais palavras da frase", () => {
    const intent = parseIntent("advogado trabalhista", context);
    assert.equal(intent.filters.cat, "direito");
    assert.equal(intent.filters.sub, "advocacia-trabalhista");
    assert.equal(intent.rest, "");
  });

  it("frase composta consome todas as palavras (sem sobrar \"beleza\")", () => {
    const intent = parseIntent("salão de beleza", context);
    assert.equal(intent.filters.sub, "saloes-de-beleza");
    assert.equal(intent.rest, "");
  });

  it("o que não é categoria vira texto livre (nome da empresa)", () => {
    const intent = parseIntent("duavesso", context);
    assert.deepEqual(intent.filters, {});
    assert.equal(intent.rest, "duavesso");
  });

  it("prefere o nome mais próximo quando há empate", () => {
    assert.equal(parseIntent("estetica", context).filters.sub, "estetica");
  });

  it("frase só com palavras de ligação não filtra nada", () => {
    const intent = parseIntent("quero uma empresa", context);
    assert.deepEqual(intent.filters, {});
  });
});

describe("companyTier", () => {
  const company = {
    name: "Clínica Sorriso",
    description: "Tratamentos odontológicos completos com ortodontia e clareamento",
    tags: ["aparelho"],
    categoryForms: ["Dentistas", "dentista", "odontologia"],
  };
  it("nome exato < começa com < contém", () => {
    assert.equal(companyTier(["clinica", "sorriso"], company), 0);
    assert.equal(companyTier(["clinica"], company), 1);
    assert.equal(companyTier(["sorriso"], company), 2);
  });
  it("categoria/sinônimo, tag e descrição", () => {
    assert.equal(companyTier(["dentista"], company), 3);
    assert.equal(companyTier(["aparelho"], company), 4);
    assert.equal(companyTier(["clareamento"], company), 5);
  });
  it("nome digitado errado ainda acha", () => {
    assert.equal(companyTier(["sorrizo"], company), 6);
  });
  it("sem relação não aparece", () => {
    assert.equal(companyTier(["pizzaria"], company), null);
  });
});
