import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FadeUp } from "@/components/motion/FadeUp";

/** Vitrine pra anunciantes externos (shopping, hotéis, grandes marcas) --
 * reaproveita o formulário de lead já existente em /seja-um-parceiro
 * (PartnerLeadForm + partner_leads), sem precisar de nenhum fluxo novo. */
export async function AdvertisersCTA() {
  const t = await getTranslations("AdvertisersCTA");

  return (
    <section className="bg-graphite py-10 text-white">
      <FadeUp className="container-page flex max-w-4xl flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-white/60">{t("eyebrow")}</p>
          <h2 className="mt-2 max-w-xl text-[clamp(1.1rem,2vw,1.4rem)] font-medium leading-tight tracking-tight">
            {t("headline")}
          </h2>
        </div>
        <Link
          href="/seja-um-parceiro"
          className="shrink-0 rounded-full bg-white px-6 py-3 text-[15px] font-medium text-graphite"
        >
          {t("cta")}
        </Link>
      </FadeUp>
    </section>
  );
}
