import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { BusinessAvatar } from "@/components/BusinessAvatar";
import { VirtualTourViewer } from "@/components/VirtualTourViewer";
import { Link, redirect } from "@/i18n/navigation";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { localizedUrl, buildSocialMetadata } from "@/lib/seo";
import {
  getAllBusinesses,
  getBusinessById,
  getBusinessBySlug,
  getRelatedBusinesses,
  getOpportunities,
  getBenefits,
  getBusinessServices,
  getBusinessPhotos,
  getVirtualTourScenes,
  logMetricEvent,
  UUID_RE,
} from "@/lib/services/platform";
import { WhatsAppLink } from "@/components/WhatsAppLink";

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

  const t = await getTranslations({ locale, namespace: "EmpresaPage" });
  const title = t("metaTitle", { name: business.name });
  const description = business.description;

  return {
    title,
    description,
    alternates: { canonical: `/empresa/${business.slug}` },
    ...buildSocialMetadata({
      title,
      description,
      locale,
      path: `/empresa/${business.slug}`,
      type: "profile",
      image: business.coverPhoto ?? business.logo,
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

  const [t, tCategories, tCommon, tOpportunityTypes, tBenefitKinds] = await Promise.all([
    getTranslations("EmpresaPage"),
    getTranslations("categories"),
    getTranslations("Common"),
    getTranslations("opportunityTypeLabels"),
    getTranslations("benefitKindLabels"),
  ]);

  const [related, allOpportunities, allBenefits, services, photos, virtualTourScenes] = await Promise.all([
    getRelatedBusinesses(business, 3, locale),
    getOpportunities(locale),
    getBenefits(locale),
    getBusinessServices(business.id, locale),
    getBusinessPhotos(business.id),
    getVirtualTourScenes(business.id, locale),
  ]);

  const opportunities = allOpportunities.filter((o) => o.businessId === business.id);
  const benefits = allBenefits.filter((b) => b.businessId === business.id);

  await logMetricEvent("commercial_page_viewed", business.id);

  const canonicalUrl = localizedUrl(locale, `/empresa/${business.slug}`);
  const categoryLabel = tCategories(business.category);

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
        item: localizedUrl(locale, `/preview?categoria=${encodeURIComponent(business.category)}`),
      },
      { "@type": "ListItem", position: 3, name: business.name, item: canonicalUrl },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header />
      <main className="flex-1">
        {/* Banner de ponta a ponta: sem max-width, a foto de capa (ou o
            degradê de fallback) vai até a borda da viewport. Avatar/nome
            sobrepõem a base do banner; descrição e CTAs ficam abaixo, já
            dentro do container de leitura. */}
        <section className="relative">
          <div
            className="h-[280px] w-full bg-cover bg-center sm:h-[360px]"
            style={
              business.coverPhoto
                ? { backgroundImage: `url(${business.coverPhoto})` }
                : { background: "linear-gradient(135deg, var(--primary), var(--connection))" }
            }
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          </div>

          <div className="px-6">
            <div className="mx-auto -mt-16 max-w-4xl sm:-mt-20">
              <Link
                href="/#empresas"
                className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-foreground/15 bg-white px-5 py-3 text-[16px] font-semibold text-foreground shadow-sm transition hover:border-foreground/30 hover:bg-foreground/5"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                {t("backToDirectory")}
              </Link>

              <div className="glass-light rounded-3xl p-8 sm:p-10">
                <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                  <BusinessAvatar
                    business={business}
                    className="h-24 w-24 rounded-2xl bg-white shadow-lg ring-4 ring-white"
                    textClassName="text-[26px] font-semibold"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] font-semibold tracking-tight">
                        {business.name}
                      </h1>
                      {business.seals.founder && (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[13px] font-medium text-amber-800">
                          {tCommon("founder")}
                        </span>
                      )}
                      {business.verified && (
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[13px] font-medium text-primary">
                          {tCommon("verified")}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-[17px] text-muted">
                      {tCategories(business.category)} · {business.floor}
                    </p>
                  </div>
                </div>

                <p className="mt-8 max-w-2xl text-[18px] leading-relaxed text-foreground/80">
                  {business.description}
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <WhatsAppLink
                    href={buildWhatsAppLink(business.phone, business.name)}
                    businessId={business.id}
                    className="neu-primary rounded-full px-6 py-3 text-[16px] font-medium text-white"
                  >
                    {tCommon("whatsapp")}
                  </WhatsAppLink>
                  <a
                    href={instagramUrl(business.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neu rounded-full px-6 py-3 text-[16px] font-medium text-foreground"
                  >
                    {t("instagram")}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="h-10 bg-surface sm:h-16" />

        {business.videoUrl && (
          <section className="bg-surface px-6 py-10">
            <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl">
              <video src={business.videoUrl} controls className="w-full" />
            </div>
          </section>
        )}

        {virtualTourScenes.length > 0 && (
          <section className="bg-surface px-6 py-10">
            <div className="mx-auto max-w-4xl">
              <h2 className="text-[15px] font-medium uppercase tracking-[0.2em] text-muted">
                {t("sectionVisitRoom")}
              </h2>
              <div className="mt-4">
                <VirtualTourViewer scenes={virtualTourScenes} />
              </div>
            </div>
          </section>
        )}

        {photos.length > 0 && (
          <section className="bg-surface px-6 py-10">
            <div className="mx-auto max-w-4xl">
              <h2 className="text-[15px] font-medium uppercase tracking-[0.2em] text-muted">{t("sectionGallery")}</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((photo) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={photo.id}
                    src={photo.url}
                    alt={t("photoAlt", { name: business.name })}
                    className="h-32 w-full rounded-xl object-cover"
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {services.length > 0 && (
          <section className="bg-background px-6 py-10">
            <div className="mx-auto max-w-4xl">
              <h2 className="text-[15px] font-medium uppercase tracking-[0.2em] text-muted">{t("sectionServices")}</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {services.map((service) => (
                  <div key={service.id} className="glass-card-light rounded-2xl p-5">
                    <p className="text-[17px] font-semibold tracking-tight">{service.name}</p>
                    {service.description && (
                      <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{service.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

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
                        <p className="mt-3 text-[17px] font-semibold tracking-tight">
                          {opportunity.title}
                        </p>
                        <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
                          {opportunity.description}
                        </p>
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
                        <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
                          {benefit.description}
                        </p>
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
                {t("alsoIn", { category: tCategories(business.category) })}
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
                      className="h-11 w-11 rounded-xl bg-white"
                      textClassName="text-[15px] font-semibold text-foreground"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[16px] font-semibold tracking-tight">
                        {candidate.name}
                      </p>
                      <p className="truncate text-[14px] text-muted">{candidate.floor}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <CinematicFooter />
    </>
  );
}
