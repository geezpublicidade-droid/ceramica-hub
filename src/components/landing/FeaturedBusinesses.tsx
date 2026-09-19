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
    <section className="bg-surface px-6 py-28 text-foreground">
      <div className="mx-auto max-w-6xl">
        <FadeUp className="max-w-2xl">
          <p className="text-[15px] font-medium uppercase tracking-[0.2em] text-primary">{t("eyebrow")}</p>
          <h2 className="mt-4 text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-tight tracking-tight">
            {t("headline")}
          </h2>
        </FadeUp>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => {
            const towerName = business.floor.split(" · ")[0];
            return (
              <FadeUp key={business.id} className="group rounded-3xl border border-border bg-white p-7">
                <div className="flex items-start justify-between gap-3">
                  <BusinessAvatar
                    business={business}
                    className="h-14 w-14 rounded-2xl bg-surface"
                    textClassName="text-[17px] font-semibold text-foreground"
                  />
                  {business.verified && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[12px] font-medium text-primary">
                      {tCommon("verified")}
                    </span>
                  )}
                </div>

                <Link href={`/empresa/${business.slug}`} className="mt-5 block">
                  <h3 className="text-[19px] font-semibold tracking-tight transition-colors group-hover:text-primary">
                    {business.name}
                  </h3>
                </Link>
                <p className="mt-1 text-[14px] text-muted">
                  {tCategories(business.category)} · {towerName}
                </p>
                <p className="mt-3 line-clamp-1 text-[15px] leading-relaxed text-muted">{business.description}</p>

                <div className="mt-6 flex items-center gap-4">
                  <Link
                    href={`/empresa/${business.slug}`}
                    className="neu rounded-full px-5 py-2.5 text-[14px] font-medium text-foreground"
                  >
                    {t("ctaKnowBusiness")}
                  </Link>
                  <WhatsAppLink
                    href={buildWhatsAppLink(business.phone, business.name)}
                    businessId={business.id}
                    className="text-[14px] font-medium text-primary transition-transform hover:translate-x-1"
                  >
                    {tCommon("whatsapp")} →
                  </WhatsAppLink>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}
