import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { Link } from "@/i18n/navigation";
import { CompanyCard } from "@/components/business/CompanyCard";
import {
  PlacementCard,
  type PlacementCardLabels,
} from "@/components/business/PlacementCard";
import { CompanySearchBox } from "@/components/empresas/CompanySearchBox";
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
import { jsonLdString } from "@/lib/json-ld";
import { localizedUrl, buildAlternates, buildSocialMetadata } from "@/lib/seo";
import {
  categoryPath,
  hasApprovedBusinesses,
  findCategoryByPath,
  getBusinessCategoryLinks,
  getCategoryTree,
  type Category,
} from "@/lib/services/categories";
import { discoverCompanies } from "@/lib/services/company-discovery";
import { getAllBusinesses } from "@/lib/services/platform";
import {
  getVisiblePlacements,
  placedBusinessIds,
  type CategoryPlacement,
} from "@/lib/services/placements";

type PageProps = {
  params: Promise<{ locale: string; path: string[] }>;
  searchParams: Promise<RawSearchParams>;
};

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

  const [t, tCommon, allBusinesses, links] = await Promise.all([
    getTranslations("CategoryPage"),
    getTranslations("Common"),
    getAllBusinesses(locale),
    getBusinessCategoryLinks(),
  ]);

  const businessesById = new Map(
    allBusinesses.map((business) => [business.id, business]),
  );
  const placements = await getVisiblePlacements(
    category,
    businessesById,
    links,
  );
  const result = await discoverCompanies(
    { ...filters, excludeIds: placedBusinessIds(placements) },
    locale,
    { businesses: allBusinesses, tree },
  );

  const action = localizedPath(locale, basePath);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const page = Math.min(filters.page, totalPages);
  const hasSponsored =
    placements.leader.length +
      placements.premium.length +
      placements.featured.length >
    0;
  const isFiltering = Boolean(
    filters.q ||
    filters.towerId ||
    filters.floor ||
    filters.verified ||
    filters.inPerson ||
    filters.online,
  );

  // só a empresa patrocinada existe e nada foi filtrado: não há o que listar nem filtrar
  const showListing = isFiltering || result.items.length > 0 || !hasSponsored;

  const sectionLabel = (placement: CategoryPlacement): PlacementCardLabels => ({
    badge: t(`badge.${placement.typeKey}`),
    verified: tCommon("verified"),
    viewProfile: t("viewProfile"),
    whatsapp: tCommon("whatsapp"),
    offer: t("offer"),
  });

  /** Categoria mais específica da empresa e as folhas abaixo da categoria atual (especialidades) para o card. */
  function placementContext(placement: CategoryPlacement) {
    const linked = [...(links.get(placement.business.id) ?? [])]
      .map((id) => tree.byId.get(id))
      .filter((c): c is Category => Boolean(c));
    const deepest = linked.sort((a, b) => b.level - a.level)[0];
    const specialties = linked
      .filter((c) => c.level > category.level)
      .map((c) => c.name);
    return { categoryLabel: deepest?.name ?? category.name, specialties };
  }

  const renderPlacement = (placement: CategoryPlacement) => {
    const { categoryLabel, specialties } = placementContext(placement);
    return (
      <PlacementCard
        key={placement.id}
        variant={placement.typeKey}
        placementId={placement.id}
        business={placement.business}
        categoryLabel={categoryLabel}
        specialties={specialties}
        offerText={placement.offerText}
        labels={sectionLabel(placement)}
      />
    );
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
    ...trail.map((node, index) => {
      const nodePath = categoryPath(tree, node);
      return {
        name: node.name,
        href: `/categoria/${nodePath}`,
        url: localizedUrl(locale, `/categoria/${nodePath}`),
        last: index === trail.length - 1,
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
    ...[...placements.leader, ...placements.premium, ...placements.featured].map(
      (placement) => placement.business,
    ),
    ...result.items.map((item) => item.business),
  ];
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("h1", { category: category.name }),
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

  const listing = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[clamp(1.3rem,2.6vw,1.7rem)] font-semibold tracking-tight">
          {hasSponsored
            ? t("allTitle", { category: category.name })
            : t("companiesTitle", { category: category.name })}
          <span className="ml-3 text-[15px] font-normal text-muted">
            {t("resultsCount", { count: result.total })}
          </span>
        </h2>
        <div className="flex items-center gap-1 rounded-full border border-border bg-white p-1 text-[14px]">
          {(["grid", "list"] as const).map((target) => (
            <Link
              key={target}
              href={`${basePath}${buildDiscoveryQuery(filters, view, { view: target === "list" ? "list" : undefined, cat: undefined, sub: undefined, spec: undefined })}`}
              aria-current={view === target ? "true" : undefined}
              className={`inline-flex min-h-9 items-center rounded-full px-4 ${view === target ? "bg-primary text-white" : "text-muted hover:text-primary"}`}
            >
              {t(target === "grid" ? "viewGrid" : "viewList")}
            </Link>
          ))}
        </div>
      </div>

      {result.items.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-border bg-white/60 px-6 py-14 text-center">
          <h3 className="text-[clamp(1.2rem,2.4vw,1.5rem)] font-semibold tracking-tight">
            {isFiltering ? t("noResultsTitle") : t("emptyTitle")}
          </h3>
          <p className="mt-3 text-[16px] text-muted">
            {isFiltering ? t("noResultsDescription") : t("emptyDescription")}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {isFiltering ? (
              <Link
                href={basePath}
                className="neu inline-flex min-h-11 items-center rounded-full px-7 text-[16px] font-medium"
              >
                {t("clear")}
              </Link>
            ) : (
              <Link
                href="/cadastro"
                className="neu-primary inline-flex min-h-11 items-center rounded-full px-7 text-[16px] font-medium text-white"
              >
                {t("ctaRegisterFree")}
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div
          className={`mt-6 grid gap-5 ${view === "list" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"}`}
        >
          {result.items.map(({ business, categoryLabel, rating }) => (
            <CompanyCard
              key={business.id}
              business={business}
              categoryLabel={categoryLabel}
              layout={view}
              labels={{
                verified: tCommon("verified"),
                whatsapp: tCommon("whatsapp"),
                viewProfile: t("viewProfile"),
                rating: rating
                  ? t("rating", {
                      average: rating.average.toFixed(1),
                      count: rating.count,
                    })
                  : undefined,
              }}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav
          className="mt-10 flex items-center justify-between gap-4"
          aria-label={t("pagination")}
        >
          {page > 1 ? (
            <Link
              href={`${basePath}${buildDiscoveryQuery(filters, view, { page: page - 1 > 1 ? String(page - 1) : undefined, cat: undefined, sub: undefined, spec: undefined })}`}
              className="neu inline-flex min-h-11 items-center rounded-full px-6 text-[15px] font-medium"
            >
              ← {t("prev")}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-[14px] text-muted">
            {t("pageOf", { page, total: totalPages })}
          </span>
          {page < totalPages ? (
            <Link
              href={`${basePath}${buildDiscoveryQuery(filters, view, { page: String(page + 1), cat: undefined, sub: undefined, spec: undefined })}`}
              className="neu inline-flex min-h-11 items-center rounded-full px-6 text-[15px] font-medium"
            >
              {t("next")} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
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
        <section className="px-6 pb-20 pt-32 sm:pt-36">
          <div className="mx-auto max-w-6xl">
            <nav aria-label="breadcrumb" className="text-[14px] text-muted">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {breadcrumb.slice(1).map((item, index, items) => (
                  <li key={item.href} className="flex items-center gap-2">
                    {index < items.length - 1 ? (
                      <Link href={item.href} className="hover:text-primary">
                        {item.name}
                      </Link>
                    ) : (
                      <span aria-current="page" className="text-foreground">
                        {item.name}
                      </span>
                    )}
                    {index < items.length - 1 && (
                      <span aria-hidden="true">→</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>

            <h1 className="mt-4 text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-tight tracking-tight">
              {t("h1", { category: category.name })}
            </h1>
            <p className="mt-3 max-w-2xl text-[17px] text-muted">
              {category.description ?? t("subtitle")}
            </p>
            <p className="mt-2 text-[14px] text-muted">
              {t("companyCountLine", {
                count: result.total + placedBusinessIds(placements).size,
              })}
            </p>

            <div className="mt-8 max-w-3xl">
              <CompanySearchBox
                defaultValue={filters.q}
                placeholder={t("searchPlaceholder", {
                  category: category.name,
                })}
                buttonLabel={t("searchButton")}
                hiddenParams={{}}
                action={action}
              />
            </div>

            {category.children.length > 0 && (
              <nav
                aria-label={t("subcategories")}
                className="-mx-6 mt-8 flex gap-2 overflow-x-auto px-6 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
              >
                <span className="inline-flex min-h-10 shrink-0 items-center rounded-full bg-primary px-4 text-[14px] font-medium text-white">
                  {t("tabAll")}
                </span>
                {category.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/categoria/${categoryPath(tree, child)}`}
                    className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-border bg-white px-4 text-[14px] text-foreground hover:border-primary/40 hover:text-primary"
                  >
                    {child.name}
                  </Link>
                ))}
              </nav>
            )}

            {placements.leader.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-4 text-[15px] font-medium uppercase tracking-[0.18em] text-primary">
                  {t("sponsoredTitle")}
                </h2>
                {placements.leader.map(renderPlacement)}
              </div>
            )}

            {placements.premium.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-4 text-[15px] font-medium uppercase tracking-[0.18em] text-primary">
                  {t("premiumTitle", { category: category.name })}
                </h2>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {placements.premium.map(renderPlacement)}
                </div>
              </div>
            )}

            {placements.featured.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-4 text-[15px] font-medium uppercase tracking-[0.18em] text-primary">
                  {t("featuredTitle", { category: category.name })}
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {placements.featured.map(renderPlacement)}
                </div>
              </div>
            )}

            {showListing && (
              <div className="mt-12 grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)]">
                <aside className="lg:sticky lg:top-28 lg:self-start">
                  <details className="rounded-2xl border border-border bg-white p-4 lg:hidden">
                    <summary className="flex min-h-11 cursor-pointer items-center text-[16px] font-medium">
                      {t("filtersTitle")}
                    </summary>
                    <div className="mt-4">{filtersForm}</div>
                  </details>
                  <div className="hidden lg:block">
                    <h2 className="mb-4 text-[15px] font-medium uppercase tracking-[0.18em] text-primary">
                      {t("filtersTitle")}
                    </h2>
                    {filtersForm}
                  </div>
                </aside>
                <div className="min-w-0">{listing}</div>
              </div>
            )}

            <aside className="mt-16 flex flex-col items-start justify-between gap-4 rounded-3xl border border-border bg-white/60 px-6 py-6 sm:flex-row sm:items-center">
              <p className="text-[17px] font-medium">{t("ctaTitle")}</p>
              <Link
                href={`/planos?categoria=${encodeURIComponent(path.join("/"))}`}
                className="neu inline-flex min-h-11 w-full items-center justify-center rounded-full px-7 text-center text-[15px] font-medium text-foreground sm:w-auto"
              >
                {t("ctaButton")}
              </Link>
            </aside>
          </div>
        </section>
      </main>
      <CinematicFooter />
    </>
  );
}
