import assert from "node:assert/strict";
import test from "node:test";
import { EMPTY_CONTENT, resolveContent, type CategoryContent } from "../category-content.ts";
import type { Category } from "../services/categories.ts";

const cat = (id: string, level: 1 | 2 | 3): Category => ({
  id,
  parentId: null,
  level,
  slug: id,
  name: id,
  description: null,
  icon: null,
  keywords: [],
  sortOrder: 0,
  children: [],
});

const withContent = (patch: Partial<CategoryContent>): CategoryContent => ({ ...EMPTY_CONTENT, ...patch });

test("subcategoria herda imagem e painel da macro, mas tem o próprio título", () => {
  const trail = [cat("macro", 1), cat("sub", 2)];
  const result = resolveContent(
    trail,
    new Map([
      ["macro", withContent({ heroImageUrl: "/a.webp", adText: "Anuncie", heroTitle: "Macro" })],
      ["sub", withContent({ heroTitle: "Sub" })],
    ]),
  );
  assert.equal(result.heroImageUrl, "/a.webp");
  assert.equal(result.adText, "Anuncie");
  assert.equal(result.heroTitle, "Sub");
});

test("texto de SEO não herda da macro", () => {
  const trail = [cat("macro", 1), cat("sub", 2)];
  const result = resolveContent(trail, new Map([["macro", withContent({ seoText: "texto da macro" })]]));
  assert.equal(result.seoText, null);
});

test("painel desligado na macro desliga nas filhas", () => {
  const trail = [cat("macro", 1), cat("sub", 2)];
  const result = resolveContent(trail, new Map([["macro", withContent({ adEnabled: false })]]));
  assert.equal(result.adEnabled, false);
});

test("sem conteúdo nenhum devolve os padrões", () => {
  assert.deepEqual(resolveContent([cat("macro", 1)], new Map()), EMPTY_CONTENT);
});
