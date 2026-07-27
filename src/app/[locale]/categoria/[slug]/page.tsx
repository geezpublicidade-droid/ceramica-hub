import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { BusinessCardGrid } from "@/components/BusinessCardGrid";
import { getAllBusinesses } from "@/lib/services/platform";
import { categorySlugs, categoryFromSlug } from "@/lib/category-slug";
import { localizedUrl, buildSocialMetadata } from "@/lib/seo";

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
    ...buildSocialMetadata({ title, description, locale, path: `/categoria/${slug}`, type: "website" }),
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

            <BusinessCardGrid
              businesses={businesses}
              emptyTitle={tDirectory("emptyTitle")}
              emptyDescription={tDirectory("emptyDescription")}
              ctaRegisterFree={tDirectory("ctaRegisterFree")}
              ctaBackLabel={t("backToAll")}
              ctaBackHref="/#empresas"
              verifiedLabel={tCommon("verified")}
              founderLabel={tCommon("founder")}
              whatsappLabel={tCommon("whatsapp")}
            />
          </div>
        </section>
      </main>
      <CinematicFooter />
    </>
  );
}
