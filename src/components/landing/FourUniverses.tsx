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

  return (
    <nav aria-label={tStrip("headline")} className="border-b border-border bg-white">
      <div className="container-page flex h-auto flex-nowrap items-stretch divide-x divide-border overflow-x-auto sm:h-[105px] sm:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {realCategories.map((category) => {
          const Icon = CATEGORY_ICONS[category] ?? LayoutGrid;
          return (
            <Link
              key={category}
              href={`/categoria/${slugFromCategory(category)}`}
              className="group flex shrink-0 flex-col items-center justify-center gap-2 px-4 py-5 text-center transition-colors hover:bg-surface hover:text-primary sm:min-w-[100px] sm:flex-1 sm:px-2 sm:py-0"
            >
              <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
              <span className="w-full text-balance text-[11px] font-medium uppercase leading-tight tracking-wide text-foreground group-hover:text-primary">
                {t(category)}
              </span>
            </Link>
          );
        })}
        <Link
          href="/business-travel"
          className="group flex shrink-0 flex-col items-center justify-center gap-2 px-4 py-5 text-center transition-colors hover:bg-surface hover:text-primary sm:min-w-[100px] sm:flex-1 sm:px-2 sm:py-0"
        >
          <BedDouble aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
          <span className="w-full text-balance text-[11px] font-medium uppercase leading-tight tracking-wide text-foreground group-hover:text-primary">
            {tStrip("hoteis.name")}
          </span>
        </Link>
        <Link
          href="/imobiliarias"
          className="group flex shrink-0 flex-col items-center justify-center gap-2 px-4 py-5 text-center transition-colors hover:bg-surface hover:text-primary sm:min-w-[100px] sm:flex-1 sm:px-2 sm:py-0"
        >
          <Building2 aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
          <span className="w-full text-balance text-[11px] font-medium uppercase leading-tight tracking-wide text-foreground group-hover:text-primary">
            {tStrip("imobiliarias.name")}
          </span>
        </Link>
        <Link
          href="/busca"
          className="group flex shrink-0 flex-col items-center justify-center gap-2 px-4 py-5 text-center transition-colors hover:bg-surface hover:text-primary sm:min-w-[100px] sm:flex-1 sm:px-2 sm:py-0"
        >
          <LayoutGrid aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
          <span className="w-full text-balance text-[11px] font-medium uppercase leading-tight tracking-wide text-foreground group-hover:text-primary">
            {tStrip("verTodas")}
          </span>
        </Link>
      </div>
    </nav>
  );
}
