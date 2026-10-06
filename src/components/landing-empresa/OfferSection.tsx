import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { whatsappUrl } from "@/lib/landing/whatsapp";
import type { LandingContext } from "./context";
import { TrackedInterestLink } from "./TrackedInterestLink";

/** Oferta exclusiva (benefício ativo e dentro da validade). Sem oferta, a seção não existe. */
export async function OfferSection({ ctx }: { ctx: LandingContext }) {
  const { offer } = ctx.data;
  if (!offer) return null;

  const t = await getTranslations("LandingEmpresa");
  const validUntil = offer.validUntil ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(offer.validUntil)) : null;
  const message = `Olá! Quero aproveitar a oferta "${offer.title}" que vi no Cerâmica Hub${offer.couponCode ? ` (cupom ${offer.couponCode})` : ""}.`;

  return (
    <section id="oferta" className="container-page py-6 sm:py-10">
      <div className="relative grid overflow-hidden rounded-md bg-primary text-white md:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col justify-center gap-4 p-7 sm:p-10">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/80">{t("offerEyebrow")}</p>
          <h2 className="text-[clamp(1.6rem,3vw,2.3rem)] font-semibold leading-tight tracking-tight">{offer.title}</h2>
          {offer.description && <p className="max-w-lg text-[16px] leading-relaxed text-white/85">{offer.description}</p>}
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-medium text-white/85">
            {offer.couponCode && <span className="rounded border border-white/40 px-2 py-0.5 font-mono tracking-wider">{t("offerCoupon", { code: offer.couponCode })}</span>}
            {validUntil && <span>{t("offerValidUntil", { date: validUntil })}</span>}
          </p>
          <div>
            <TrackedInterestLink
              href={whatsappUrl(ctx.whatsappPhone, message)}
              businessId={ctx.business.id}
              itemId={offer.id}
              event="offer_clicked"
              couponCode={offer.couponCode}
              className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3.5 text-[15px] font-semibold text-primary transition hover:bg-white/90"
            >
              {offer.ctaLabel ?? t("offerCta")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </TrackedInterestLink>
          </div>
        </div>
        {offer.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={offer.imageUrl} alt="" loading="lazy" className="h-56 w-full object-cover md:h-full" />
        )}
      </div>
    </section>
  );
}
