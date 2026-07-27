import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { getActivePartners } from "@/lib/services/institutional-partners";
import { buildSocialMetadata } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("PartnersPage");
  const title = t("metaTitle");
  const description = t("metaDescription");
  return {
    title,
    description,
    alternates: { canonical: "/parceiros" },
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
              <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {partners.map((partner) => (
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <CinematicFooter />
    </>
  );
}
