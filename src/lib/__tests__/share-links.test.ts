import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { socialShareUrl, trackedLink, utmSlug, utmSourceFromSearch, withUtm } from "../share-links.ts";

describe("withUtm", () => {
  it("acrescenta os parâmetros mantendo os que já existem", () => {
    const url = withUtm("https://ceramicahub.com.br/empresa/duavesso?pl=abc", { source: "instagram", medium: "bio", campaign: "lancamento" });
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get("pl"), "abc");
    assert.equal(parsed.searchParams.get("utm_source"), "instagram");
    assert.equal(parsed.searchParams.get("utm_medium"), "bio");
    assert.equal(parsed.searchParams.get("utm_campaign"), "lancamento");
  });

  it("não cria parâmetros vazios e preserva o hash", () => {
    const url = withUtm("https://ceramicahub.com.br/planos#destaque-categoria", { source: "facebook", medium: "social" });
    assert.ok(url.endsWith("#destaque-categoria"));
    assert.equal(new URL(url).searchParams.has("utm_campaign"), false);
  });

  it("sobrescreve UTM antigo em vez de duplicar", () => {
    const url = withUtm("https://x.com/a?utm_source=velho", { source: "novo", medium: "m" });
    assert.deepEqual(new URL(url).searchParams.getAll("utm_source"), ["novo"]);
  });
});

describe("utmSlug / trackedLink", () => {
  it("normaliza acentos e símbolos", () => {
    assert.equal(utmSlug("Clínica São José!"), "clinica-sao-jose");
    assert.equal(utmSlug("  --Promoção de Outubro--  "), "promocao-de-outubro");
  });

  it("monta o link do canal escolhido", () => {
    const link = new URL(trackedLink("https://ceramicahub.com.br/empresa/x", "google_business", "Perfil da Empresa"));
    assert.equal(link.searchParams.get("utm_source"), "google");
    assert.equal(link.searchParams.get("utm_medium"), "business_profile");
    assert.equal(link.searchParams.get("utm_campaign"), "perfil-da-empresa");
  });
});

describe("socialShareUrl", () => {
  it("codifica a URL e o texto", () => {
    const href = socialShareUrl("whatsapp", "https://a.com/?x=1&y=2", "Veja a Clínica");
    assert.ok(href.startsWith("https://wa.me/?text="));
    assert.ok(href.includes(encodeURIComponent("https://a.com/?x=1&y=2")));
    assert.ok(socialShareUrl("facebook", "https://a.com", "t").includes("sharer.php?u=https%3A%2F%2Fa.com"));
  });
});

describe("utmSourceFromSearch", () => {
  it("lê, normaliza e limita a fonte", () => {
    assert.equal(utmSourceFromSearch("?utm_source=Instagram&utm_medium=bio"), "instagram");
    assert.equal(utmSourceFromSearch("?foo=1"), "");
  });
});
