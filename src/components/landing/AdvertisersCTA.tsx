import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FadeUp } from "@/components/motion/FadeUp";

/** Vitrine pra anunciantes externos (shopping, hotéis, grandes marcas) --
 * reaproveita o formulário de lead já existente em /seja-um-parceiro
 * (PartnerLeadForm + partner_leads), sem precisar de nenhum fluxo novo. */
export async function AdvertisersCTA() {
  const t = await getTranslations("AdvertisersCTA");

  return (
    <section className="bg-graphite py-[var(--space-2xl)] text-white">
      <FadeUp className="container-page flex max-w-4xl flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[14px] font-medium uppercase tracking-[0.2em] text-white/60">{t("eyebrow")}</p>
          <h2 className="mt-3 max-w-xl text-[clamp(1.6rem,3.5vw,2.5rem)] font-semibold leading-tight tracking-tight">
            {t("headline")}
          </h2>
        </div>
        <Link
          href="/seja-um-parceiro"
          className="shrink-0 rounded-full bg-white px-7 py-3.5 text-[16px] font-medium text-graphite"
        >
          {t("cta")}
        </Link>
      </FadeUp>
    </section>
  );
}
