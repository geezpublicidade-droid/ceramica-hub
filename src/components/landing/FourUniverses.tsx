import { getTranslations } from "next-intl/server";
import {
  Scale,
  HeartPulse,
  UtensilsCrossed,
  Shirt,
  Megaphone,
  GraduationCap,
  PenTool,
  BedDouble,
  Building2,
  LayoutGrid,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { FadeUp } from "@/components/motion/FadeUp";
import { categories } from "@/data/businesses";
import { slugFromCategory } from "@/lib/category-slug";

const CATEGORY_ICONS: Record<string, typeof Scale> = {
  "Contabilidade & Jurídico": Scale,
  "Saúde & Estética": HeartPulse,
  Alimentação: UtensilsCrossed,
  "Moda & Beleza": Shirt,
  "Tecnologia & Marketing": Megaphone,
  Educação: GraduationCap,
  "Design & Arquitetura": PenTool,
};

const realCategories = categories.filter((category) => category !== "Todas");

/** Faixa compacta de navegação por categoria, logo após o hero -- usa a
 * lista real de categorias (src/data/businesses.ts) mais Hotéis/Imóveis
 * (funcionalidades próprias, fora do enum de categoria), cada item
 * apontando pra um filtro/rota real (/categoria/[slug], /business-travel,
 * /imobiliarias, /busca). Nenhum item aqui é decorativo. */
export async function FourUniverses() {
  const t = await getTranslations("categories");
  const tStrip = await getTranslations("FourUniverses");

  const ITEM_CLASS =
    "group flex h-[110px] w-[110px] shrink-0 flex-col items-center justify-center gap-3 bg-surface/60 px-3 text-center transition-colors duration-300 hover:-translate-y-1 hover:bg-primary hover:shadow-[0_16px_32px_-16px_rgba(179,85,58,0.45)]";
  const LABEL_CLASS =
    "w-full text-balance text-[13px] font-semibold uppercase leading-[1.15] tracking-wide text-foreground transition-colors group-hover:text-white";
  const ICON_CLASS = "h-6 w-6 shrink-0 text-primary transition-colors group-hover:text-white";

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
      <div className="container-page flex flex-nowrap items-start gap-3 overflow-x-auto py-8 sm:flex-wrap sm:justify-center sm:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map(({ key, href, Icon, label }, index) => (
          <FadeUp key={key} delay={index * 0.04} className="shrink-0">
            <Link href={href} className={ITEM_CLASS}>
              <Icon aria-hidden="true" className={ICON_CLASS} strokeWidth={1.5} />
              <span className={LABEL_CLASS}>{label}</span>
            </Link>
          </FadeUp>
        ))}
      </div>
    </nav>
  );
}
