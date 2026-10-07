import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { whatsappUrl } from "@/lib/landing/whatsapp";
import type { LandingContext } from "./context";
import { TrackedInterestLink } from "./TrackedInterestLink";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(iso));
}

/** Promoções publicadas (limite do plano): a mais recente vira o banner e as demais aparecem como cartões. Sem promoção ativa, a seção some. */
export async function OfferSection({ ctx }: { ctx: LandingContext }) {
  const [offer, ...others] = ctx.data.offers;
  if (!offer) return null;

  const t = await getTranslations("LandingEmpresa");
  const message = (title: string, code: string | null) => `Olá! Quero aproveitar a oferta "${title}" que vi no Cerâmica Hub${code ? ` (cupom ${code})` : ""}.`;
  const whatsapp = ctx.data.capabilities.whatsapp;

  return (
    <section id="oferta" className="container-page py-6 sm:py-10">
      <div className="relative grid overflow-hidden rounded-md bg-primary text-white md:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col justify-center gap-4 p-7 sm:p-10">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/80">{t("offerEyebrow")}</p>
          <h2 className="text-[clamp(1.6rem,3vw,2.3rem)] font-semibold leading-tight tracking-tight">{offer.title}</h2>
          {offer.description && <p className="max-w-lg text-[16px] leading-relaxed text-white/85">{offer.description}</p>}
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-medium text-white/85">
            {offer.couponCode && <span className="rounded border border-white/40 px-2 py-0.5 font-mono tracking-wider">{t("offerCoupon", { code: offer.couponCode })}</span>}
            {offer.validUntil && <span>{t("offerValidUntil", { date: formatDate(offer.validUntil) })}</span>}
          </p>
          {whatsapp && (
            <div>
              <TrackedInterestLink
                href={whatsappUrl(ctx.whatsappPhone, message(offer.title, offer.couponCode))}
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
          )}
        </div>
        {offer.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={offer.imageUrl} alt="" loading="lazy" className="h-56 w-full object-cover md:h-full" />
        )}
      </div>

      {others.length > 0 && (
        <>
          <h3 className="mb-3 mt-8 text-[13px] font-semibold uppercase tracking-[0.14em] text-foreground">{t("offerMore")}</h3>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((item) => (
              <li key={item.id} className="rounded-md border border-black/[0.07] bg-white p-4">
                <p className="text-[16px] font-semibold tracking-tight">{item.title}</p>
                {item.description && <p className="mt-1 text-[14px] leading-relaxed text-foreground/70">{item.description}</p>}
                <p className="mt-2 flex flex-wrap gap-x-3 text-[12.5px] font-medium text-primary">
                  {item.couponCode && <span className="font-mono">{t("offerCoupon", { code: item.couponCode })}</span>}
                  {item.validUntil && <span className="text-muted">{t("offerValidUntil", { date: formatDate(item.validUntil) })}</span>}
                </p>
                {whatsapp && (
                  <TrackedInterestLink
                    href={whatsappUrl(ctx.whatsappPhone, message(item.title, item.couponCode))}
                    businessId={ctx.business.id}
                    itemId={item.id}
                    event="offer_clicked"
                    couponCode={item.couponCode}
                    className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-primary hover:underline"
                  >
                    {item.ctaLabel ?? t("offerCta")}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </TrackedInterestLink>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
