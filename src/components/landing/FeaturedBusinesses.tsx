import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FadeUp } from "@/components/motion/FadeUp";
import { BusinessAvatar } from "@/components/BusinessAvatar";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { Business } from "@/data/businesses";

type FeaturedBusinessesProps = {
  businesses: Business[];
};

/** Foto real só quando a empresa autorizou uso de imagem (image_usage_
 * authorized no banco) -- nunca mostra a foto cadastrada sem essa
 * autorização, mesmo que exista. Sem foto real/autorizada, cai numa
 * imagem genérica por categoria (gastronomia pra Alimentação, corporativa
 * pro resto) -- nunca susbtitui foto real por gerada. */
function resolveCardImage(business: Business): string {
  if (business.imageUsageAuthorized && business.coverPhoto) return business.coverPhoto;
  return business.category === "Alimentação"
    ? "/images/ceramica-hub-gastronomia.webp"
    : "/images/ceramica-hub-corporativo.webp";
}

/** Editorial, não grade genérica: poucos cards (o que existir de verdade,
 * nunca preenchido com lixo de teste), com 1 linha de descrição
 * (line-clamp, não corte de string) e torre curta, não o endereço completo
 * que o BusinessCardGrid usa nas páginas de categoria/torre. */
export async function FeaturedBusinesses({ businesses }: FeaturedBusinessesProps) {
  const t = await getTranslations("FeaturedBusinesses");
  const tCategories = await getTranslations("categories");
  const tCommon = await getTranslations("Common");

  if (businesses.length === 0) return null;

  return (
    <section className="section-pad-y bg-surface text-foreground">
      <div className="container-page grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,2.2fr)] lg:gap-[clamp(32px,5vw,72px)]">
        <FadeUp>
          <p className="text-[15px] font-medium uppercase tracking-[0.2em] text-primary">{t("eyebrow")}</p>
          <h2 className="mt-3 text-[clamp(1.8rem,3.2vw,2.5rem)] font-semibold leading-tight tracking-tight">
            {t("headline")}
          </h2>
        </FadeUp>

        <div className="grid grid-cols-1 gap-[var(--card-gap)] sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business, index) => {
            const towerName = business.floor.split(" · ")[0];
            return (
              <FadeUp
                key={business.id}
                delay={(index % 3) * 0.08}
                className="group flex flex-col overflow-hidden border border-border bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_48px_-24px_rgba(0,0,0,0.25)]"
              >
                <div className="relative h-[150px] w-full overflow-hidden bg-surface">
                  <Image
                    src={resolveCardImage(business)}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    loading="lazy"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="relative z-10 flex flex-1 flex-col bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <BusinessAvatar
                      business={business}
                      className="-mt-9 h-12 w-12 shrink-0 rounded-full border-2 border-white bg-surface shadow-sm"
                      textClassName="text-[15px] font-semibold text-foreground"
                    />
                    {business.verified && (
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[12px] font-medium text-primary">
                        {tCommon("verified")}
                      </span>
                    )}
                  </div>

                  <Link href={`/empresa/${business.slug}`} className="mt-3 block">
                    <h3 className="text-[17px] font-semibold tracking-tight transition-colors group-hover:text-primary">
                      {business.name}
                    </h3>
                  </Link>
                  <p className="mt-1 text-[13px] text-muted">
                    {tCategories(business.category)} · {towerName}
                  </p>
                  <p className="mt-1.5 line-clamp-1 text-[13px] leading-snug text-muted/85">{business.description}</p>

                  <div className="mt-4 flex items-center gap-4 pt-1">
                    <Link
                      href={`/empresa/${business.slug}`}
                      className="neu rounded-full px-4 py-2 text-[13px] font-medium text-foreground"
                    >
                      {t("ctaKnowBusiness")}
                    </Link>
                    <WhatsAppLink
                      href={buildWhatsAppLink(business.phone, business.name)}
                      businessId={business.id}
                      className="text-[13px] font-medium text-primary transition-transform hover:translate-x-1"
                    >
                      {tCommon("whatsapp")} →
                    </WhatsAppLink>
                  </div>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}
