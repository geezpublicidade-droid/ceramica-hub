import { parseOgFormat, renderCard } from "@/lib/og/card";
import { categoryBreadcrumb, findCategoryByPath, getCategoryTree } from "@/lib/services/categories";

export const dynamic = "force-dynamic";

/** Imagem de compartilhamento de uma categoria: `?path=saude-e-estetica/dentistas&formato=og|feed|story`. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = parseOgFormat(url.searchParams.get("formato"));
  const slugs = (url.searchParams.get("path") ?? "").split("/").filter(Boolean).slice(0, 3);

  const tree = await getCategoryTree();
  const category = findCategoryByPath(tree, slugs)?.at(-1);
  if (!category) return new Response("Não encontrada", { status: 404 });

  const parents = categoryBreadcrumb(tree, category).split(" › ").slice(0, -1).join(" › ");
  return renderCard({
    format,
    eyebrow: parents || "Empresas",
    title: category.name,
    subtitle: "no Espaço Cerâmica",
    meta: "São Caetano do Sul · SP",
    logo: null,
    initials: category.name.slice(0, 2).toUpperCase(),
    cta: "Encontre empresas no Cerâmica Hub",
  });
}
