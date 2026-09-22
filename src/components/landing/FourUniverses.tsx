import { getTranslations } from "next-intl/server";
import { Briefcase, UtensilsCrossed, BedDouble, Building2, LayoutGrid } from "lucide-react";
import { Link } from "@/i18n/navigation";

const UNIVERSES = [
  { key: "corporate", href: "#empresas", Icon: Briefcase },
  { key: "lifestyle", href: "#empresas", Icon: UtensilsCrossed },
  { key: "hoteis", href: "/business-travel", Icon: BedDouble },
  { key: "imobiliarias", href: "/imobiliarias", Icon: Building2 },
] as const;

/** Faixa compacta de categorias logo após o hero -- parte da navegação da
 * plataforma, não mais o bloco editorial alto de antes. Mesmos 4 universos
 * (Corporate/Lifestyle/Hotéis/Imobiliárias), agora com ícone + nome numa
 * faixa horizontal com divisores discretos. */
export async function FourUniverses() {
  const t = await getTranslations("FourUniverses");

  return (
    <nav aria-label={t("headline")} className="border-b border-border bg-white">
      <div className="container-page flex h-auto flex-nowrap items-stretch divide-x divide-border overflow-x-auto sm:h-[104px] sm:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {UNIVERSES.map(({ key, href, Icon }) => (
          <Link
            key={key}
            href={href}
            className="group flex shrink-0 flex-col items-center justify-center gap-2 px-6 py-5 text-center transition-colors hover:bg-surface sm:min-w-[150px] sm:flex-1 sm:px-4 sm:py-0"
          >
            <Icon aria-hidden="true" className="h-5 w-5 text-primary" strokeWidth={1.75} />
            <span className="whitespace-nowrap text-[13px] font-medium uppercase tracking-wide text-foreground">
              {t(`${key}.name`)}
            </span>
          </Link>
        ))}
        <Link
          href="/busca"
          className="group flex shrink-0 flex-col items-center justify-center gap-2 px-6 py-5 text-center transition-colors hover:bg-surface sm:min-w-[150px] sm:flex-1 sm:px-4 sm:py-0"
        >
          <LayoutGrid aria-hidden="true" className="h-5 w-5 text-primary" strokeWidth={1.75} />
          <span className="whitespace-nowrap text-[13px] font-medium uppercase tracking-wide text-foreground">
            {t("verTodas")}
          </span>
        </Link>
      </div>
    </nav>
  );
}
