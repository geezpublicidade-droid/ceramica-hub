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

  // cards off-white; o fundo ganha uma mancha terracota desfocada (forte nos pares, suave nos ímpares) que se intensifica no hover
  const ITEM_BASE =
    "btn-shine group relative flex h-[104px] w-[124px] shrink-0 flex-col items-center justify-center gap-2.5 border border-border bg-surface px-2 py-3 text-center hover:border-primary/40 hover:shadow-[0_16px_32px_-16px_rgba(179,85,58,0.45)] sm:h-[112px] sm:w-[148px]";
  const GLOW_BASE = "pointer-events-none absolute -bottom-7 left-1/2 h-16 w-24 -translate-x-1/2 rounded-full bg-primary blur-2xl transition-opacity duration-300";
  const GLOW = { strong: "opacity-55 group-hover:opacity-80", soft: "opacity-20 group-hover:opacity-60" };
  const LABEL_BASE = "relative w-full break-words text-balance text-[13px] font-semibold uppercase leading-[1.15] tracking-wide transition-colors";
  const ICON_BASE = "relative text-primary h-7 w-7 shrink-0 transition-colors";

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
      <div className="py-6 sm:py-8">
        <DragScroller label={tStrip("headline")} prevLabel={tStrip("prev")} nextLabel={tStrip("next")}>
          {items.map(({ key, href, Icon, label }, index) => {
            const glow = index % 2 === 0 ? GLOW.strong : GLOW.soft;
            return (
              <Link key={key} href={href} draggable={false} className={ITEM_BASE}>
                <span aria-hidden="true" className={`${GLOW_BASE} ${glow}`} />
                <Icon aria-hidden="true" className={ICON_BASE} strokeWidth={1.5} />
                <span className={`${LABEL_BASE} text-foreground`}>{label}</span>
              </Link>
            );
          })}
        </DragScroller>
      </div>
    </nav>
  );
}
