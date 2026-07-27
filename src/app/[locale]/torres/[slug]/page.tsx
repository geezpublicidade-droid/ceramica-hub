import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { BusinessCardGrid } from "@/components/BusinessCardGrid";
import { getAllBusinesses } from "@/lib/services/platform";
import { getActiveTowers, getTowerBySlug } from "@/lib/services/towers";
import { localizedUrl, buildSocialMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export const revalidate = 60;

export async function generateStaticParams() {
  const towers = await getActiveTowers();
  return towers.map((tower) => ({ slug: tower.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const tower = await getTowerBySlug(slug);
  if (!tower) return {};

  const t = await getTranslations({ locale, namespace: "TowerPage" });
  const title = t("metaTitle", { tower: tower.name });
  const description = t("metaDescription", { tower: tower.name, address: tower.address });

  return {
    title,
    description,
    alternates: { canonical: `/torres/${slug}` },
    ...buildSocialMetadata({ title, description, locale, path: `/torres/${slug}`, type: "website" }),
  };
}

export default async function TowerPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const tower = await getTowerBySlug(slug);
  if (!tower) notFound();

  const [t, tCommon, tDirectory, allBusinesses] = await Promise.all([
    getTranslations("TowerPage"),
    getTranslations("Common"),
    getTranslations("Directory"),
    getAllBusinesses(locale),
  ]);

  const businesses = allBusinesses.filter((business) => business.floor.startsWith(`${tower.name} ·`));
  const canonicalUrl = localizedUrl(locale, `/torres/${slug}`);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tCommon("home"), item: localizedUrl(locale, "/") },
      { "@type": "ListItem", position: 2, name: tower.name, item: canonicalUrl },
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
              {t("heading", { tower: tower.name })}
            </h1>
            <p className="mt-3 max-w-md text-[17px] text-muted">{tower.address}</p>

            <BusinessCardGrid
              businesses={businesses}
              emptyTitle={tDirectory("emptyTitle")}
              emptyDescription={tDirectory("emptyDescription")}
              ctaRegisterFree={tDirectory("ctaRegisterFree")}
              ctaBackLabel={t("backToAll")}
              ctaBackHref="/#empresas"
              verifiedLabel={tCommon("verified")}
              whatsappLabel={tCommon("whatsapp")}
            />
          </div>
        </section>
      </main>
      <CinematicFooter />
    </>
  );
}
