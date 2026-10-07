import { getTranslations } from "next-intl/server";
import { BedDouble, Building2, LayoutGrid } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DragScroller } from "@/components/ui/DragScroller";
import { categories } from "@/data/businesses";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { slugFromCategory } from "@/lib/category-slug";

const realCategories = categories.filter((category) => category !== "Todas");

/** Faixa compacta de navegação por categoria, logo após o hero -- usa a
 * lista real de categorias (src/data/businesses.ts) mais Hotéis/Imóveis
 * (funcionalidades próprias, fora do enum de categoria), cada item
 * apontando pra um filtro/rota real (/categoria/[slug], /business-travel,
 * /imobiliarias, /busca). Nenhum item aqui é decorativo. */
export async function FourUniverses() {
  const t = await getTranslations("categories");
  const tStrip = await getTranslations("FourUniverses");

  // cards alternando terracota e branco; no hover trocam de cor
  const ITEM_BASE =
    "group flex h-[104px] w-[124px] shrink-0 flex-col items-center justify-center gap-2.5 border px-2 py-3 text-center transition-colors duration-300 hover:shadow-[0_16px_32px_-16px_rgba(179,85,58,0.45)] sm:h-[112px] sm:w-[148px]";
  const TERRACOTTA = { item: "border-primary bg-primary hover:bg-white", label: "text-white group-hover:text-foreground", icon: "text-white group-hover:text-primary" };
  const WHITE = { item: "border-border bg-white hover:border-primary hover:bg-primary", label: "text-foreground group-hover:text-white", icon: "text-primary group-hover:text-white" };
  const LABEL_BASE = "w-full break-words text-balance text-[13px] font-semibold uppercase leading-[1.15] tracking-wide transition-colors";
  const ICON_BASE = "h-7 w-7 shrink-0 transition-colors";

  const items = [
    ...realCategories.map((category) => {
      const slug = slugFromCategory(category);
      return {
        key: category,
        href: `/categoria/${slug}`,
        Icon: CATEGORY_ICONS[category] ?? LayoutGrid,
        label: tStrip.has(`short.${slug}`) ? tStrip(`short.${slug}`) : t(category),
      };
    }),
    { key: "hoteis", href: "/business-travel", Icon: BedDouble, label: tStrip("hoteis.name") },
    { key: "imobiliarias", href: "/imobiliarias", Icon: Building2, label: tStrip("imobiliarias.name") },
    { key: "busca", href: "/busca", Icon: LayoutGrid, label: tStrip("verTodas") },
  ];

  return (
    <nav aria-label={tStrip("headline")} className="border-b border-border bg-white">
      <div className="container-page py-6 sm:py-8">
        <DragScroller label={tStrip("headline")} prevLabel={tStrip("prev")} nextLabel={tStrip("next")}>
          {items.map(({ key, href, Icon, label }, index) => {
            const tone = index % 2 === 0 ? TERRACOTTA : WHITE;
            return (
              <Link key={key} href={href} draggable={false} className={`${ITEM_BASE} ${tone.item}`}>
                <Icon aria-hidden="true" className={`${ICON_BASE} ${tone.icon}`} strokeWidth={1.5} />
                <span className={`${LABEL_BASE} ${tone.label}`}>{label}</span>
              </Link>
            );
          })}
        </DragScroller>
      </div>
    </nav>
  );
}
