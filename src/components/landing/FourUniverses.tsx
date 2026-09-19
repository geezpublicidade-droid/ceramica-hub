import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FadeUp } from "@/components/motion/FadeUp";

const UNIVERSES = [
  { key: "corporate", index: "01", href: "#empresas" },
  { key: "lifestyle", index: "02", href: "#empresas" },
  { key: "hoteis", index: "03", href: "/business-travel" },
  { key: "imobiliarias", index: "04", href: "/imobiliarias" },
] as const;

/** Editorial de propósito, sem foto por universo (ainda não existem fotos
 * reais pra Corporate/Lifestyle/Hotéis/Imobiliárias -- só as 4 do hero, ver
 * public/images). Tipografia grande + linha fazendo o papel visual que uma
 * foto faria, em vez de grade de card com ícone genérico. */
export async function FourUniverses() {
  const t = await getTranslations("FourUniverses");

  return (
    <section className="bg-surface px-6 py-28 text-foreground">
      <div className="mx-auto max-w-6xl">
        <FadeUp className="max-w-2xl">
          <p className="text-[15px] font-medium uppercase tracking-[0.2em] text-primary">{t("eyebrow")}</p>
          <h2 className="mt-4 text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-tight tracking-tight">
            {t("headline")}
          </h2>
        </FadeUp>

        <div className="mt-16 divide-y divide-border border-t border-border">
          {UNIVERSES.map((universe, i) => (
            <FadeUp key={universe.key} delay={i * 0.05}>
              <Link
                href={universe.href}
                className="group flex flex-col gap-3 py-8 transition-colors sm:flex-row sm:items-center sm:gap-8 sm:py-10"
              >
                <span className="text-[15px] font-medium tabular-nums text-muted">{universe.index}</span>
                <span className="text-[clamp(1.6rem,3.5vw,2.5rem)] font-semibold tracking-tight transition-colors group-hover:text-primary sm:w-[280px] sm:shrink-0">
                  {t(`${universe.key}.name`)}
                </span>
                <span className="text-[16px] leading-relaxed text-muted sm:max-w-md">
                  {t(`${universe.key}.description`)}
                </span>
                <span
                  aria-hidden="true"
                  className="ml-auto hidden text-[20px] text-muted transition-all group-hover:translate-x-1 group-hover:text-primary sm:block"
                >
                  →
                </span>
              </Link>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
