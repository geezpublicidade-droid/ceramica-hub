import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { BusinessAvatar } from "@/components/BusinessAvatar";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { Link } from "@/i18n/navigation";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { getAllBusinesses } from "@/lib/services/platform";
import { categorySlugs, categoryFromSlug } from "@/lib/category-slug";
import { routing } from "@/i18n/routing";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function localizedUrl(locale: string, path: string): string {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${siteUrl}${prefix}${path}`;
}

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export const revalidate = 60;

export async function generateStaticParams() {
  return categorySlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const category = categoryFromSlug(slug);
  if (!category) return {};

  const [t, tCategories] = await Promise.all([
    getTranslations({ locale, namespace: "CategoryPage" }),
    getTranslations({ locale, namespace: "categories" }),
  ]);
  const categoryLabel = tCategories(category);
  const title = t("metaTitle", { category: categoryLabel });
  const description = t("metaDescription", { category: categoryLabel });

  return {
    title,
    description,
    alternates: { canonical: `/categoria/${slug}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const category = categoryFromSlug(slug);
  if (!category) notFound();

  const [t, tCategories, tCommon, tDirectory, allBusinesses] = await Promise.all([
    getTranslations("CategoryPage"),
    getTranslations("categories"),
    getTranslations("Common"),
    getTranslations("Directory"),
    getAllBusinesses(locale),
  ]);

  const categoryLabel = tCategories(category);
  const businesses = allBusinesses.filter((business) => business.category === category);
  const canonicalUrl = localizedUrl(locale, `/categoria/${slug}`);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tCommon("home"), item: localizedUrl(locale, "/") },
      { "@type": "ListItem", position: 2, name: categoryLabel, item: canonicalUrl },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header />
      <main className="flex-1">
        <section className="px-6 pb-16 pt-32 sm:pt-36">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-tight tracking-tight">
              {t("heading", { category: categoryLabel })}
            </h1>
            <p className="mt-3 max-w-md text-[17px] text-muted">{t("subtitle")}</p>

            {businesses.length === 0 ? (
              <div className="mt-14 rounded-3xl border border-border bg-white/60 px-6 py-16 text-center">
                <h2 className="text-[clamp(1.4rem,3vw,1.9rem)] font-semibold tracking-tight text-foreground">
                  {tDirectory("emptyTitle")}
                </h2>
                <p className="mt-4 text-[17px] leading-relaxed text-muted">{tDirectory("emptyDescription")}</p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <Link
                    href="/cadastro"
                    className="neu-primary rounded-full px-7 py-3.5 text-[17px] font-medium text-white"
                  >
                    {tDirectory("ctaRegisterFree")}
                  </Link>
                  <Link href="/#empresas" className="neu rounded-full px-7 py-3.5 text-[17px] font-medium text-foreground">
                    {t("backToAll")}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {businesses.map((business) => (
                  <div
                    key={business.id}
                    className="glass-card-light group flex gap-5 rounded-3xl p-7 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)]"
                  >
                    <Link href={`/empresa/${business.slug}`} className="shrink-0">
                      <BusinessAvatar
                        business={business}
                        className="h-20 w-20 rounded-2xl bg-white"
                        textClassName="text-[20px] font-semibold text-foreground"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/empresa/${business.slug}`} className="min-w-0">
                          <h2 className="text-[20px] font-semibold leading-snug tracking-tight hover:text-primary">
                            {business.name}
                          </h2>
                        </Link>
                        {business.verified && (
                          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[13px] font-medium text-primary">
                            {tCommon("verified")}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-[16px] text-muted">{business.floor}</p>
                      <p className="mt-3 text-[17px] leading-relaxed text-muted">{business.description}</p>
                      <WhatsAppLink
                        href={buildWhatsAppLink(business.phone, business.name)}
                        businessId={business.id}
                        className="mt-4 inline-flex items-center gap-1.5 text-[16px] font-medium text-primary transition-transform hover:translate-x-1"
                      >
                        {tCommon("whatsapp")}
                        <span aria-hidden="true">→</span>
                      </WhatsAppLink>
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
