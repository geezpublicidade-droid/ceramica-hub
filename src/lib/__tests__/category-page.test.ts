import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { countActiveFilters, pillContext, safeHref } from "../category-page.ts";
import type { Category } from "../services/categories.ts";

const cat = (id: string, level: 1 | 2 | 3, children: Category[] = []): Category => ({
  id, parentId: null, level, slug: id, name: id, description: null, icon: null, keywords: [], sortOrder: 0, children,
});

describe("safeHref", () => {
  it("aceita http(s) como externo e caminho interno como interno", () => {
    assert.deepEqual(safeHref("https://exemplo.com/a", "/x"), { href: "https://exemplo.com/a", external: true });
    assert.deepEqual(safeHref("/empresa/foo", "/x"), { href: "/empresa/foo", external: false });
  });
  it("rejeita javascript:, data: e protocolo relativo", () => {
    for (const bad of ["javascript:alert(1)", "data:text/html,x", "//evil.com", "", "   ", null, undefined]) {
      assert.deepEqual(safeHref(bad, "/x"), { href: "/x", external: false });
    }
  });
});

describe("countActiveFilters", () => {
  it("conta só os filtros avançados ligados", () => {
    assert.equal(countActiveFilters({ verified: false, inPerson: false, online: false }), 0);
    assert.equal(countActiveFilters({ towerId: "t", floor: "2", verified: true, inPerson: false, online: true }), 4);
  });
});

describe("pillContext", () => {
  const sub = cat("sub", 2);
  const other = cat("other", 2);
  const macro = cat("macro", 1, [sub, other]);
  it("macro mostra as filhas sem pílula ativa", () => {
    assert.deepEqual(pillContext([macro]), { parent: macro, items: [sub, other], activeId: null });
  });
  it("subcategoria sem filhas mostra as irmãs com a atual ativa", () => {
    assert.deepEqual(pillContext([macro, sub]), { parent: macro, items: [sub, other], activeId: "sub" });
  });
  it("subcategoria com filhas mostra as filhas", () => {
    const spec = cat("spec", 3);
    const subWithChildren = cat("sub2", 2, [spec]);
    assert.deepEqual(pillContext([macro, subWithChildren]), { parent: subWithChildren, items: [spec], activeId: null });
  });
});
