import { notFound } from "next/navigation";
import { slugFromCategory } from "@/lib/category-slug";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { AdHereBanner } from "@/components/ads/AdHereBanner";
import { BusinessAvatar } from "@/components/BusinessAvatar";
import { LandingPageEmpresa } from "@/components/landing-empresa/LandingPageEmpresa";
import { Link, redirect } from "@/i18n/navigation";
import { localizedUrl, buildAlternates, buildSocialMetadata, siteUrl } from "@/lib/seo";
import { jsonLdString } from "@/lib/json-ld";
import {
  getAllBusinesses,
  getBusinessById,
  getBusinessBySlug,
  getRelatedBusinesses,
  getOpportunities,
  getBenefits,
  UUID_RE,
} from "@/lib/services/platform";
import { getLandingConfig } from "@/lib/services/landing";
import { buildLandingContext } from "@/lib/services/landing-context";
import { ProfileVisitTracker } from "@/components/business/ProfileVisitTracker";
import { ShareButtons } from "@/components/promo/ShareButtons";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

// dynamicParams + revalidate (ISR) em vez de SSG puro: o deploy é manual
// (`vercel --prod`), então uma empresa aprovada no /admin precisa aparecer
// na hora, sem esperar o próximo deploy.
export const dynamicParams = true;
export const revalidate = 60;

export async function generateStaticParams() {
  const businesses = await getAllBusinesses();
  return businesses.map((business) => ({ slug: business.slug }));
}

/** URLs antigas usavam o UUID como slug — resolve o negócio por qualquer um dos dois. */
async function resolveBusiness(param: string, locale?: string) {
  if (UUID_RE.test(param)) return getBusinessById(param, locale);
  return getBusinessBySlug(param, locale);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const business = await resolveBusiness(slug, locale);
  if (!business) return {};

  const [t, landing] = await Promise.all([getTranslations({ locale, namespace: "EmpresaPage" }), getLandingConfig(business.id)]);
  // título/descrição de SEO só valem com a landing publicada (rascunho não vaza para o público)
  const custom = landing.status === "published" ? landing : null;
  const title = custom?.seoTitle ?? t("metaTitle", { name: business.name });
  const description = custom?.seoDescription ?? business.description;

  return {
    title,
    description,
    alternates: buildAlternates(locale, `/empresa/${business.slug}`),
    ...buildSocialMetadata({
      title,
      description,
      locale,
      path: `/empresa/${business.slug}`,
      type: "profile",
      // arte da marca com a logo (a foto de capa só entra com uso de imagem autorizado, e isso o gerador já respeita)
      image: `${siteUrl}/api/og/empresa/${business.slug}`,
    }),
  };
}

function instagramUrl(handle: string) {
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}

export default async function BusinessProfilePage({ params }: PageProps) {
  const { slug, locale } = await params;
  const business = await resolveBusiness(slug, locale);
  if (!business || business.status !== "approved") notFound();

  // link antigo com UUID: redireciona pra URL canônica com slug
  if (UUID_RE.test(slug) && business.slug !== slug) {
    redirect({ href: `/empresa/${business.slug}`, locale });
  }

  const [t, tShare, tCategories, tCommon, tOpportunityTypes, tBenefitKinds] = await Promise.all([
    getTranslations("EmpresaPage"),
    getTranslations("Share"),
    getTranslations("categories"),
    getTranslations("Common"),
    getTranslations("opportunityTypeLabels"),
    getTranslations("benefitKindLabels"),
  ]);

  const canonicalUrl = localizedUrl(locale, `/empresa/${business.slug}`);
  const categoryLabel = tCategories(business.category);

  const [related, allOpportunities, allBenefits, ctx] = await Promise.all([
    getRelatedBusinesses(business, 3, locale),
    getOpportunities(locale),
    getBenefits(locale),
    buildLandingContext(business, canonicalUrl, categoryLabel, { locale }),
  ]);
  const landingData = ctx.data;

  const opportunities = allOpportunities.filter((o) => o.businessId === business.id);
  const benefits = allBenefits.filter((b) => b.businessId === business.id);

  const businessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    description: business.description,
    url: canonicalUrl,
    ...(business.phone ? { telephone: business.phone } : {}),
    ...(business.coverPhoto || business.logo
      ? { image: business.coverPhoto ?? business.logo }
      : {}),
    ...(business.instagram ? { sameAs: [instagramUrl(business.instagram)] } : {}),
    ...(business.openingHours ? { openingHours: business.openingHours } : {}),
    ...(landingData.reviewStats.count > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: landingData.reviewStats.average.toFixed(1), reviewCount: landingData.reviewStats.count } }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tCommon("home"), item: localizedUrl(locale, "/") },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryLabel,
        item: localizedUrl(locale, `/categoria/${slugFromCategory(business.category)}`),
      },
      { "@type": "ListItem", position: 3, name: business.name, item: canonicalUrl },
    ],
  };

  const faqJsonLd =
    landingData.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: landingData.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        }
      : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(businessJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(faqJsonLd) }} />}
      <Header />
      <ProfileVisitTracker businessId={business.id} name={business.name} category={business.category} />
      <main className="flex-1">
        <LandingPageEmpresa ctx={ctx}>
          {business.videoUrl && landingData.videos.length === 0 && (
            <section className="container-page py-10">
              <div className="mx-auto max-w-4xl overflow-hidden rounded-md">
                <video src={business.videoUrl} controls className="w-full" />
              </div>
            </section>
          )}

          <div className="container-page py-6">
            <ShareButtons
              url={canonicalUrl}
              text={tShare("text", { name: business.name })}
              campaign={`empresa-${business.slug}`}
              labels={{ title: tShare("title"), copy: tShare("copy"), copied: tShare("copied") }}
            />
          </div>

          <AdHereBanner tone={1} />

          {(opportunities.length > 0 || benefits.length > 0) && (
            <section className="bg-surface px-6 py-16">
              <div className="mx-auto max-w-4xl space-y-10">
                {opportunities.length > 0 && (
                  <div>
                    <h2 className="text-[15px] font-medium uppercase tracking-[0.2em] text-primary">
                      {t("sectionOpportunities")}
                    </h2>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {opportunities.map((opportunity) => (
                        <div key={opportunity.id} className="glass-card-light rounded-2xl p-5">
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[13px] font-medium text-primary">
                            {tOpportunityTypes(opportunity.type)}
                          </span>
                          <p className="mt-3 text-[17px] font-semibold tracking-tight">{opportunity.title}</p>
                          <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{opportunity.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {benefits.length > 0 && (
                  <div>
                    <h2 className="text-[15px] font-medium uppercase tracking-[0.2em] text-primary">
                      {t("sectionBenefits")}
                    </h2>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {benefits.map((benefit) => (
                        <div key={benefit.id} className="glass-card-light rounded-2xl p-5">
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[13px] font-medium text-primary">
                            {tBenefitKinds(benefit.kind)}
                          </span>
                          <p className="mt-3 text-[17px] font-semibold tracking-tight">{benefit.title}</p>
                          <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{benefit.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {related.length > 0 && (
            <section className="bg-background px-6 py-16">
              <div className="mx-auto max-w-4xl">
                <h2 className="text-[15px] font-medium uppercase tracking-[0.2em] text-muted">
                  {t("alsoIn", { category: categoryLabel })}
                </h2>
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {related.map((candidate) => (
                    <Link
                      key={candidate.id}
                      href={`/empresa/${candidate.slug}`}
                      className="glass-card-light group flex items-center gap-3 rounded-2xl p-4 transition-colors hover:border-primary/20"
                    >
                      <BusinessAvatar
                        business={candidate}
                        className="h-11 w-11 rounded-full bg-white"
                        textClassName="text-[15px] font-semibold text-foreground"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[16px] font-semibold tracking-tight">{candidate.name}</p>
                        <p className="truncate text-[14px] text-muted">{candidate.floor}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}
          <AdHereBanner />
        </LandingPageEmpresa>
      </main>
      <CinematicFooter />
    </>
  );
}
