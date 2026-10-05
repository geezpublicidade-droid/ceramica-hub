import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { Link } from "@/i18n/navigation";
import { BusinessCard } from "@/components/categoria/BusinessCard";
import { BusinessGrid } from "@/components/categoria/BusinessGrid";
import { AdSlotCard } from "@/components/categoria/AdSlotCard";
import { CategoryAdPanel } from "@/components/categoria/CategoryAdPanel";
import { CategoryFilterBar, type FilterPill } from "@/components/categoria/CategoryFilterBar";
import { CategoryHero } from "@/components/categoria/CategoryHero";
import { EmptyCategoryState } from "@/components/categoria/EmptyCategoryState";
import { SponsoredCarousel, type SponsoredSlide } from "@/components/categoria/SponsoredCarousel";
import { CompanySearchBox } from "@/components/empresas/CompanySearchBox";
import { ShareButtons } from "@/components/promo/ShareButtons";
import {
  DiscoveryFilters,
  type DiscoveryFilterLabels,
} from "@/components/empresas/DiscoveryFilters";
import {
  buildDiscoveryQuery,
  DISCOVERY_SORTS,
  localizedPath,
  parseDiscoveryParams,
  type RawSearchParams,
} from "@/lib/discovery-params";
import { countActiveFilters, pillContext, safeHref } from "@/lib/category-page";
import { jsonLdString } from "@/lib/json-ld";
import { localizedUrl, buildAlternates, buildSocialMetadata, siteUrl } from "@/lib/seo";
import {
  categoryPath,
  hasApprovedBusinesses,
  findCategoryByPath,
  getBusinessCategoryLinks,
  getCategoryTree,
  type Category,
} from "@/lib/services/categories";
import { getCategoryContent } from "@/lib/services/category-showcase";
import { discoverCompanies } from "@/lib/services/company-discovery";
import { getAllBusinesses } from "@/lib/services/platform";
import { getVisiblePlacements, type CategoryPlacement } from "@/lib/services/placements";

const CAROUSEL_SLOTS = 4; // 1 Líder + 3 Premium
const FEATURED_SLOTS = 6;
const GRID_OPEN_SLOTS = 3;

type PageProps = {
  params: Promise<{ locale: string; path: string[] }>;
  searchParams: Promise<RawSearchParams>;
};

/** Abas de subcategoria visíveis no desktop antes do "Ver mais" (Saúde & Estética tem 22). */

// Posições pagas rotacionam a cada carregamento e dependem de data/pagamento: sempre dinâmica.
export const dynamic = "force-dynamic";

async function resolveTrail(path: string[], locale: string) {
  const tree = await getCategoryTree(locale);
  const trail = findCategoryByPath(tree, path);
  return { tree, trail };
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { locale, path } = await params;
  const raw = await searchParams;
  const { trail } = await resolveTrail(path, locale);
  if (!trail) return {};

  const category = trail[trail.length - 1];
  const [t, hasCompanies] = await Promise.all([
    getTranslations({ locale, namespace: "CategoryPage" }),
    hasApprovedBusinesses(category),
  ]);
  const title = t("metaTitle", { category: category.name });
  const description =
    category.description ?? t("metaDescription", { category: category.name });
  const canonicalPath = `/categoria/${path.join("/")}`;

  return {
    title,
    description,
    // Só indexa categoria com conteúdo e sem filtros/busca/paginação aplicados.
    robots:
      !hasCompanies || Object.keys(raw).length > 0
        ? { index: false, follow: true }
        : undefined,
    alternates: buildAlternates(locale, canonicalPath),
    ...buildSocialMetadata({
      title,
      description,
      locale,
      path: canonicalPath,
      type: "website",
      image: `${siteUrl}/api/og/categoria?path=${encodeURIComponent(path.join("/"))}`,
    }),
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { locale, path } = await params;
  const { filters: parsed, view } = parseDiscoveryParams(await searchParams);
  const { tree, trail } = await resolveTrail(path, locale);
  if (!trail) notFound();

  const category = trail[trail.length - 1];
  const basePath = `/categoria/${path.join("/")}`;
  const filters = { ...parsed, cat: path[0], sub: path[1], spec: path[2] };
  const isFiltering = Boolean(
    filters.q ||
    filters.towerId ||
    filters.floor ||
    filters.verified ||
    filters.inPerson ||
    filters.online,
  );

  const [t, tShare, tCommon, allBusinesses, links, content] = await Promise.all([
    getTranslations("CategoryPage"),
    getTranslations("Share"),
    getTranslations("Common"),
    getAllBusinesses(locale),
    getBusinessCategoryLinks(),
    getCategoryContent(trail),
  ]);

  const businessesById = new Map(
    allBusinesses.map((business) => [business.id, business]),
  );
  const placements = await getVisiblePlacements(
    category,
    businessesById,
    links,
  );
  // Líder e Premium vivem no carrossel; Destaque abre a lista (só sem filtro, para não esconder quem bate com ele)
  const carouselPlacements = [...placements.leader, ...placements.premium];
  const featuredPlacements = isFiltering ? [] : placements.featured;
  const excludeIds = new Set(
    [...carouselPlacements, ...featuredPlacements].map((placement) => placement.business.id),
  );
  const result = await discoverCompanies(
    { ...filters, excludeIds },
    locale,
    { businesses: allBusinesses, tree },
  );

  const action = localizedPath(locale, basePath);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const page = Math.min(filters.page, totalPages);
  const shownFeatured = page === 1 ? featuredPlacements : [];
  const totalResults = result.total + featuredPlacements.length;
  const advertiseHref = `/planos?categoria=${encodeURIComponent(path.join("/"))}#destaque-categoria`;

  /** Categoria mais específica da empresa, para o card e os slides. */
  function categoryLabelFor(placement: CategoryPlacement) {
    const linked = [...(links.get(placement.business.id) ?? [])]
      .map((id) => tree.byId.get(id))
      .filter((c): c is Category => Boolean(c));
    return linked.sort((a, b) => b.level - a.level)[0]?.name ?? category.name;
  }

  const slides: SponsoredSlide[] = carouselPlacements.map((placement) => {
    const { business, creative } = placement;
    const destination = safeHref(creative.targetUrl, `/empresa/${business.slug}?pl=${placement.id}`);
    return {
      id: placement.id,
      placementId: placement.id,
      businessId: business.id,
      title: creative.headline ?? business.name,
      subtitle: [categoryLabelFor(placement), business.floor].filter(Boolean).join(" · "),
      description: creative.description ?? business.description,
      image: creative.imageUrl ?? (business.imageUsageAuthorized ? business.coverPhoto : undefined),
      imageMobile: creative.imageMobileUrl ?? undefined,
      href: destination.href,
      external: destination.external,
      ctaLabel: creative.ctaLabel ?? t("viewProfile"),
    };
  });

  // vagas livres: o carrossel sempre mostra as 4 cotas (Líder + 3 Premium) e a grade até 3 vagas Destaque
  const openSlides: SponsoredSlide[] = Array.from({ length: Math.max(0, CAROUSEL_SLOTS - slides.length) }, (_, i) => ({
    id: `open-${i}`,
    placementId: "",
    businessId: "",
    title: t("adHere"),
    subtitle: category.name,
    description: t("adHereText", { category: category.name }),
    href: advertiseHref,
    external: false,
    ctaLabel: t("adCta"),
    open: true,
  }));
  const openGridSlots = isFiltering || page !== 1 ? 0 : Math.min(GRID_OPEN_SLOTS, Math.max(0, FEATURED_SLOTS - shownFeatured.length));

  const cardLabels = {
    verified: tCommon("verified"),
    whatsapp: tCommon("whatsapp"),
    viewProfile: t("viewProfile"),
  };

  const filterLabels: DiscoveryFilterLabels = {
    category: t("filterCategory"),
    sub: t("filterSub"),
    spec: t("filterSpec"),
    tower: t("filterTower"),
    floor: t("filterFloor"),
    all: t("all"),
    verified: t("filterVerified"),
    inPerson: t("filterInPerson"),
    online: t("filterOnline"),
    sort: t("sortLabel"),
    sortOptions: Object.fromEntries(
      DISCOVERY_SORTS.map((sort) => [sort, t(`sort.${sort}`)]),
    ) as DiscoveryFilterLabels["sortOptions"],
    apply: t("apply"),
    clear: t("clear"),
  };

  const filtersForm = (
    <DiscoveryFilters
      action={action}
      filters={filters}
      macros={[]}
      subs={[]}
      specs={[]}
      towers={result.towers}
      floors={result.floors}
      view={view}
      hideCategory
      hideSort
      labels={filterLabels}
    />
  );

  const breadcrumb = [
    { name: tCommon("home"), href: "/", url: localizedUrl(locale, "/") },
    {
      name: t("breadcrumbRoot"),
      href: "/empresas",
      url: localizedUrl(locale, "/empresas"),
    },
    ...trail.map((node) => {
      const nodePath = categoryPath(tree, node);
      return {
        name: node.name,
        href: `/categoria/${nodePath}`,
        url: localizedUrl(locale, `/categoria/${nodePath}`),
      };
    }),
  ];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumb.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  // Lista de empresas da página para buscadores: patrocinadas e orgânicas entram do mesmo jeito,
  // sem marcar anúncio no dado estruturado (a identificação "Patrocinado" é do visitante, no card).
  const listedBusinesses = [
    ...[...carouselPlacements, ...placements.featured].map((placement) => placement.business),
    ...result.items.map((item) => item.business),
  ];
  const heroTitle = content.heroTitle ?? t("h1", { category: category.name });
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: heroTitle,
    url: localizedUrl(locale, basePath),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: listedBusinesses.length,
      itemListElement: listedBusinesses.map((business, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: localizedUrl(locale, `/empresa/${business.slug}`),
        name: business.name,
      })),
    },
  };

  const pillInfo = pillContext(trail);
  const pills: FilterPill[] = pillInfo.items.map((child) => ({
    id: child.id,
    label: child.name,
    href: `/categoria/${categoryPath(tree, child)}`,
  }));
  const queryFor = (overrides: Parameters<typeof buildDiscoveryQuery>[2]) =>
    `${basePath}${buildDiscoveryQuery(filters, view, { cat: undefined, sub: undefined, spec: undefined, page: undefined, ...overrides })}`;

  const adPanel = content.adEnabled ? (
    <CategoryAdPanel
      eyebrow={content.adEyebrow ?? t("adEyebrow")}
      text={content.adText ?? t("adText")}
      ctaLabel={content.adCtaLabel ?? t("adCta")}
      ctaHref={safeHref(content.adCtaUrl, advertiseHref).href}
    />
  ) : undefined;

  const openCards = Array.from({ length: openGridSlots }, (_, i) => (
    <AdSlotCard
      key={`open-${i}`}
      index={i}
      title={t("adHere")}
      description={t("adHereText", { category: category.name })}
      ctaLabel={t("adCta")}
      badge={t("openSlot")}
      href={advertiseHref}
    />
  ));
  const openGrid = openGridSlots > 0 ? <BusinessGrid layout={view}>{openCards}</BusinessGrid> : null;

  const emptyState = (
    <EmptyCategoryState
      title={isFiltering ? t("noResultsTitle") : t("emptyTitle")}
      description={isFiltering ? t("noResultsDescription") : t("emptyDescription")}
      actions={
        isFiltering ? (
          <Link href={basePath} className="neu inline-flex min-h-11 items-center rounded-full px-7 text-[16px] font-medium">
            {t("clear")}
          </Link>
        ) : (
          <>
            <Link href="/cadastro" className="neu-primary inline-flex min-h-11 items-center rounded-full px-7 text-[16px] font-medium text-white">
              {t("ctaRegisterFree")}
            </Link>
            <Link href={advertiseHref} className="neu inline-flex min-h-11 items-center rounded-full px-7 text-[16px] font-medium">
              {t("ctaButton")}
            </Link>
          </>
        )
      }
    />
  );

  const paginationLink = (target: number, label: string) => (
    <Link
      href={queryFor({ page: target > 1 ? String(target) : undefined })}
      className="neu inline-flex min-h-11 items-center rounded-full px-6 text-[15px] font-medium"
    >
      {label}
    </Link>
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(collectionJsonLd) }}
      />
      <Header />
      <main className="flex-1">
        <CategoryHero
          breadcrumb={breadcrumb.slice(1).map(({ name, href }) => ({ name, href }))}
          breadcrumbLabel={t("breadcrumbLabel")}
          title={heroTitle}
          description={content.heroDescription ?? category.description ?? t("subtitle")}
          helper={content.heroHelper}
          image={{
            desktop: content.heroImageUrl ?? "/images/ceramica-hub-hero.webp",
            mobile: content.heroImageMobileUrl,
            alt: content.heroImageAlt ?? t("heroImageAlt"),
          }}
          search={
            <CompanySearchBox
              defaultValue={filters.q}
              placeholder={t("searchPlaceholder", { category: category.name })}
              buttonLabel={t("searchButton")}
              hiddenParams={{}}
              action={action}
            />
          }
          adPanel={adPanel}
        />

        <section className="container-page pt-10 sm:pt-12">
            <h2 className="text-[clamp(1.4rem,2.6vw,1.9rem)] font-semibold tracking-tight">
              {t("highlightsTitle", { category: category.name })}
            </h2>
            <p className="mt-1 text-[15px] text-muted">{content.highlightsText ?? t("highlightsDefault")}</p>
            <div className="mt-5 lg:px-5">
              <SponsoredCarousel
                slides={[...slides, ...openSlides]}
                labels={{
                  sponsored: t("sponsored"),
                  openSlot: t("openSlot"),
                  region: t("highlightsTitle", { category: category.name }),
                  previous: t("carouselPrev"),
                  next: t("carouselNext"),
                  goTo: t("carouselGoTo", { n: "{n}" }),
                }}
              />
            </div>
          </section>

        <section className="container-page pb-20 pt-8 sm:pt-10">
          <CategoryFilterBar
            pills={pills}
            allHref={`/categoria/${categoryPath(tree, pillInfo.parent)}`}
            activePillId={pillInfo.activeId}
            labels={{
              subcategories: t("subcategories"),
              all: t("tabAll"),
              subcategoriesPrev: t("subcategoriesPrev"),
              subcategoriesNext: t("subcategoriesNext"),
              filters: t("filtersButton"),
              filtersTitle: t("filtersTitle"),
              close: t("closeFilters"),
              sort: t("sortLabel"),
              resultsCount: t("resultsCount", { count: totalResults }),
              viewGrid: t("viewGrid"),
              viewList: t("viewList"),
            }}
            activeFilterCount={countActiveFilters(filters)}
            filtersForm={filtersForm}
            sort={{
              value: filters.sort,
              options: DISCOVERY_SORTS.map((sort) => ({
                value: sort,
                label: t(`sort.${sort}`),
                href: queryFor({ sort: sort === "relevance" ? undefined : sort }),
              })),
            }}
            view={view}
            viewHrefs={{ grid: queryFor({ view: undefined }), list: queryFor({ view: "list" }) }}
          />

          <h2 className="sr-only">{t("companiesTitle", { category: category.name })}</h2>

          <div className="mt-6">
            {shownFeatured.length === 0 && result.items.length === 0 ? (
              <>
                {emptyState}
                {openGrid}
              </>
            ) : (
              <BusinessGrid layout={view}>
                {shownFeatured.map((placement) => (
                  <BusinessCard
                    key={placement.id}
                    business={placement.business}
                    categoryLabel={categoryLabelFor(placement)}
                    layout={view}
                    labels={cardLabels}
                    placement={{ id: placement.id, badge: t("badge.featured") }}
                  />
                ))}
                {openCards}
                {result.items.map(({ business, categoryLabel, rating }) => (
                  <BusinessCard
                    key={business.id}
                    business={business}
                    categoryLabel={categoryLabel}
                    layout={view}
                    labels={{
                      ...cardLabels,
                      rating: rating
                        ? t("rating", { average: rating.average.toFixed(1), count: rating.count })
                        : undefined,
                    }}
                  />
                ))}
              </BusinessGrid>
            )}
          </div>

          {totalPages > 1 && (
            <nav className="mt-10 flex items-center justify-between gap-4" aria-label={t("pagination")}>
              {page > 1 ? paginationLink(page - 1, `← ${t("prev")}`) : <span />}
              <span className="text-[14px] text-muted">{t("pageOf", { page, total: totalPages })}</span>
              {page < totalPages ? paginationLink(page + 1, `${t("next")} →`) : <span />}
            </nav>
          )}

          {content.seoText && (
            <div className="mt-16 max-w-3xl space-y-4 text-[16px] leading-relaxed text-muted">
              {content.seoText.split(/\n{2,}/).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          )}

          <div className="mt-10">
            <ShareButtons
              url={localizedUrl(locale, basePath)}
              text={tShare("categoryText", { category: category.name })}
              campaign={`categoria-${path.join("-")}`}
              labels={{ title: tShare("title"), copy: tShare("copy"), copied: tShare("copied") }}
            />
          </div>

          <aside className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-white/60 px-6 py-6 sm:flex-row sm:items-center">
            <p className="text-[17px] font-medium">{t("ctaTitle")}</p>
            <Link
              href={advertiseHref}
              className="neu inline-flex min-h-11 w-full items-center justify-center rounded-full px-7 text-center text-[15px] font-medium text-foreground sm:w-auto"
            >
              {t("ctaButton")}
            </Link>
          </aside>
        </section>
      </main>
      <CinematicFooter />
    </>
  );
}
