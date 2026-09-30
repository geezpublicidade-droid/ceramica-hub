import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { getActivePartners } from "@/lib/services/institutional-partners";
import { buildAlternates, buildSocialMetadata } from "@/lib/seo";
import { PARTNER_TIERS } from "@/lib/partner-tiers";
import { Link } from "@/i18n/navigation";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("PartnersPage");
  const title = t("metaTitle");
  const description = t("metaDescription");
  return {
    title,
    description,
    alternates: buildAlternates(locale, "/parceiros"),
    ...buildSocialMetadata({ title, description, locale, path: "/parceiros" }),
  };
}

export default async function PartnersPage() {
  const [t, partners] = await Promise.all([getTranslations("PartnersPage"), getActivePartners()]);

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="px-6 pb-16 pt-32 sm:pt-36">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-tight tracking-tight">
              {t("heading")}
            </h1>
            <p className="mt-3 max-w-md text-[17px] text-muted">{t("subtitle")}</p>

            {partners.length === 0 ? (
              <p className="mt-14 text-[17px] text-muted">{t("emptyState")}</p>
            ) : (
              <div className="mt-12 flex flex-col gap-12">
                {PARTNER_TIERS.map((tier) => {
                  const group = partners.filter((partner) => partner.tier === tier);
                  if (group.length === 0) return null;
                  return (
                    <section key={tier}>
                      <h2 className="text-[13px] font-medium uppercase tracking-[0.2em] text-primary">
                        {t(`tierTitles.${tier}`)}
                      </h2>
                      {tier === "parceiro_ecossistema" && (
                        <p className="mt-2 max-w-xl text-[14px] text-muted">{t("ecosystemNote")}</p>
                      )}
                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {group.map((partner) => (
                          <div
                            key={partner.id}
                            className="glass-card-light flex items-center gap-4 rounded-2xl p-6"
                          >
                            {partner.logoUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={partner.logoUrl} alt={partner.name} className="h-12 w-auto object-contain" />
                            )}
                            <div className="min-w-0">
                              {partner.link ? (
                                <a
                                  href={partner.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[17px] font-semibold text-foreground hover:text-primary"
                                >
                                  {partner.name}
                                </a>
                              ) : (
                                <p className="text-[17px] font-semibold text-foreground">{partner.name}</p>
                              )}
                              <p className="text-[14px] text-muted">{partner.partnershipType}</p>
                              {partner.pageSlug && (
                                <Link href={`/parceiros/${partner.pageSlug}`} className="mt-1 inline-block text-[14px] font-medium text-primary hover:underline">
                                  {t("viewPage")}
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <CinematicFooter />
    </>
  );
}
