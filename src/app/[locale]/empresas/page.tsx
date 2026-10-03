import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { Link } from "@/i18n/navigation";
import { CompanyCard } from "@/components/business/CompanyCard";
import { CategoryIcon } from "@/components/empresas/CategoryIcon";
import { SmartSearch } from "@/components/search/SmartSearch";
import { DiscoveryFilters, type DiscoveryFilterLabels } from "@/components/empresas/DiscoveryFilters";
import { buildDiscoveryQuery, DISCOVERY_SORTS, localizedPath, parseDiscoveryParams, type RawSearchParams } from "@/lib/discovery-params";
import { parseIntent, type IntentChip } from "@/lib/search-intent";
import { discoverCompanies } from "@/lib/services/company-discovery";
import { getSearchCorpus } from "@/lib/services/search-corpus";
import { logMetricEvent } from "@/lib/services/platform";
import { jsonLdString } from "@/lib/json-ld";
import { localizedUrl, buildAlternates, buildSocialMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<RawSearchParams>;
};

// Depende de searchParams (filtros/busca) a cada request.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const raw = await searchParams;
  const t = await getTranslations({ locale, namespace: "EmpresasPage" });
  const title = t("metaTitle");
  const description = t("metaDescription");
  // Qualquer filtro/busca/paginação vira variação da mesma página: não indexa, o canonical aponta para /empresas.
  const hasVariation = Object.keys(raw).length > 0;
  return {
    title,
    description,
    robots: hasVariation ? { index: false, follow: true } : undefined,
    alternates: buildAlternates(locale, "/empresas"),
    ...buildSocialMetadata({ title, description, locale, path: "/empresas", type: "website" }),
  };
}

export default async function EmpresasPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const rawParams = await searchParams;
  const parsed = parseDiscoveryParams(rawParams);
  const { view } = parsed;
  let filters = parsed.filters;

  // Frase solta na URL ("?q=dentista torre park"): interpreta categoria, torre, andar e filtros, a não ser
  // que a pessoa tenha escolhido "buscar só pelo texto" (?texto=1) ou já tenha filtrado por categoria.
  const textOnly = rawParams.texto === "1";
  let understood: IntentChip[] = [];
  if (filters.q && !filters.cat && !textOnly) {
    const corpus = await getSearchCorpus(locale);
    const intent = parseIntent(filters.q, { categories: corpus.categories, towers: corpus.towers, floors: corpus.floors });
    if (intent.chips.length > 0) {
      understood = intent.chips;
      filters = {
        ...filters,
        cat: intent.filters.cat,
        sub: intent.filters.sub,
        spec: intent.filters.spec,
        towerId: filters.towerId ?? intent.filters.towerId,
        floor: filters.floor ?? intent.filters.floor,
        verified: filters.verified || Boolean(intent.filters.verified),
        inPerson: filters.inPerson || Boolean(intent.filters.inPerson),
        online: filters.online || Boolean(intent.filters.online),
        q: intent.rest,
      };
    }
  }

  const [t, tCommon, result] = await Promise.all([
    getTranslations("EmpresasPage"),
    getTranslations("Common"),
    discoverCompanies(filters, locale),
  ]);

  const { selected, tree } = result;
  if (result.total === 0 && filters.q) {
    // demanda que o portal não atende: alimenta o painel de analytics (o que recrutar)
    await logMetricEvent("search_no_results", undefined, { term: filters.q.slice(0, 80) }).catch(() => undefined);
  }
  const action = localizedPath(locale, "/empresas");
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const page = Math.min(filters.page, totalPages);

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
    sortOptions: Object.fromEntries(DISCOVERY_SORTS.map((sort) => [sort, t(`sort.${sort}`)])) as DiscoveryFilterLabels["sortOptions"],
    apply: t("apply"),
    clear: t("clear"),
  };

  const filtersForm = (
    <DiscoveryFilters
      action={action}
      filters={filters}
      macros={tree.roots}
      subs={selected.macro?.children ?? []}
      specs={selected.sub?.children ?? []}
      towers={result.towers}
      floors={result.floors}
      view={view}
      labels={filterLabels}
    />
  );

  const towerName = result.towers.find((tower) => tower.id === filters.towerId)?.name;
  const chips: { label: string; removeQuery: string }[] = [
    filters.q && { label: `“${filters.q}”`, removeQuery: buildDiscoveryQuery(filters, view, { q: undefined, page: undefined }) },
    selected.macro && { label: selected.macro.name, removeQuery: buildDiscoveryQuery(filters, view, { cat: undefined, sub: undefined, spec: undefined, page: undefined }) },
    selected.sub && { label: selected.sub.name, removeQuery: buildDiscoveryQuery(filters, view, { sub: undefined, spec: undefined, page: undefined }) },
    selected.spec && { label: selected.spec.name, removeQuery: buildDiscoveryQuery(filters, view, { spec: undefined, page: undefined }) },
    towerName && { label: towerName, removeQuery: buildDiscoveryQuery(filters, view, { tower: undefined, page: undefined }) },
    filters.floor && { label: filters.floor, removeQuery: buildDiscoveryQuery(filters, view, { floor: undefined, page: undefined }) },
    filters.verified && { label: t("filterVerified"), removeQuery: buildDiscoveryQuery(filters, view, { verified: undefined, page: undefined }) },
    filters.inPerson && { label: t("filterInPerson"), removeQuery: buildDiscoveryQuery(filters, view, { presencial: undefined, page: undefined }) },
    filters.online && { label: t("filterOnline"), removeQuery: buildDiscoveryQuery(filters, view, { online: undefined, page: undefined }) },
  ].filter((chip): chip is { label: string; removeQuery: string } => Boolean(chip));

  const examples = t("examples").split("|");
  const viewLink = (target: "grid" | "list") =>
    `${action}${buildDiscoveryQuery(filters, view, { view: target === "list" ? "list" : undefined })}`;

  const listJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("heading"),
    url: localizedUrl(locale, "/empresas"),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(listJsonLd) }} />
      <Header />
      <main className="flex-1">
        <section className="px-6 pb-20 pt-32 sm:pt-36">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-tight tracking-tight">{t("heading")}</h1>
            <p className="mt-3 max-w-xl text-[17px] text-muted">{t("subtitle")}</p>

            <div className="mt-8 max-w-3xl">
              <SmartSearch variant="page" source="smart_search" defaultValue={filters.q} />
              {understood.length > 0 && (
                <p className="mt-3 flex flex-wrap items-center gap-2 text-[14px] text-muted">
                  <span>{t("understood")}</span>
                  {understood.map((chip) => (
                    <span key={`${chip.kind}-${chip.label}`} className="rounded-full bg-primary/10 px-3 py-1 text-[13px] font-medium text-primary">
                      {chip.label}
                    </span>
                  ))}
                  <Link href={`/empresas?q=${encodeURIComponent(String(rawParams.q ?? ""))}&texto=1`} className="underline underline-offset-4 hover:text-primary">
                    {t("textOnly")}
                  </Link>
                </p>
              )}
              <p className="mt-3 text-[14px] text-muted">
                {t("examplesLabel")}{" "}
                {examples.map((example, index) => (
                  <span key={example}>
                    <Link href={`/empresas?q=${encodeURIComponent(example)}`} className="underline-offset-2 hover:text-primary hover:underline">
                      {example}
                    </Link>
                    {index < examples.length - 1 ? " · " : ""}
                  </span>
                ))}
              </p>
            </div>

            <h2 className="mt-14 text-[15px] font-medium uppercase tracking-[0.18em] text-primary">{t("categoriesTitle")}</h2>
            <div className="-mx-6 mt-4 flex gap-3 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4">
              {tree.roots.map((root) => (
                <Link
                  key={root.id}
                  href={`/categoria/${root.slug}`}
                  className={`glass-card-light flex min-h-20 w-56 shrink-0 items-center gap-4 rounded-2xl px-5 py-4 transition-colors hover:border-primary/30 sm:w-auto ${
                    selected.macro?.id === root.id ? "border-primary/40" : ""
                  }`}
                >
                  <CategoryIcon name={root.icon} className="h-7 w-7 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block truncate text-[16px] font-medium text-foreground">{root.name}</span>
                    <span className="block text-[13px] text-muted">
                      {t("companyCount", { count: result.macroCounts.get(root.id) ?? 0 })}
                    </span>
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-14 grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)]">
              <aside className="lg:sticky lg:top-28 lg:self-start">
                <details className="rounded-2xl border border-border bg-white p-4 lg:hidden">
                  <summary className="flex min-h-11 cursor-pointer items-center text-[16px] font-medium">
                    {t("filtersTitle")}
                    {chips.length > 0 && <span className="ml-2 rounded-full bg-primary/10 px-2 text-[13px] text-primary">{chips.length}</span>}
                  </summary>
                  <div className="mt-4">{filtersForm}</div>
                </details>
                <div className="hidden lg:block">
                  <h2 className="mb-4 text-[15px] font-medium uppercase tracking-[0.18em] text-primary">{t("filtersTitle")}</h2>
                  {filtersForm}
                </div>
              </aside>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[16px] text-foreground">
                    <strong className="font-semibold">{t("resultsCount", { count: result.total })}</strong>
                  </p>
                  <div className="flex items-center gap-1 rounded-full border border-border bg-white p-1 text-[14px]">
                    {(["grid", "list"] as const).map((target) => (
                      <Link
                        key={target}
                        href={viewLink(target)}
                        aria-current={view === target ? "true" : undefined}
                        className={`inline-flex min-h-9 items-center rounded-full px-4 ${
                          view === target ? "bg-primary text-white" : "text-muted hover:text-primary"
                        }`}
                      >
                        {t(target === "grid" ? "viewGrid" : "viewList")}
                      </Link>
                    ))}
                  </div>
                </div>

                {chips.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {chips.map((chip) => (
                      <Link
                        key={chip.label}
                        href={`/empresas${chip.removeQuery}`}
                        className="inline-flex min-h-9 items-center gap-2 rounded-full bg-primary/10 px-3.5 text-[14px] text-primary"
                        aria-label={`${t("remove")}: ${chip.label}`}
                      >
                        {chip.label}
                        <span aria-hidden="true">×</span>
                      </Link>
                    ))}
                    <Link href="/empresas" className="px-2 text-[14px] text-muted hover:text-primary">
                      {t("clear")}
                    </Link>
                  </div>
                )}

                {result.items.length === 0 ? (
                  <div className="mt-8 rounded-3xl border border-border bg-white/60 px-6 py-14 text-center">
                    <h2 className="text-[clamp(1.3rem,2.6vw,1.7rem)] font-semibold tracking-tight">{t("noResultsTitle")}</h2>
                    <p className="mt-3 text-[16px] text-muted">{t("noResultsDescription")}</p>
                    <Link href="/empresas" className="neu mt-6 inline-flex min-h-11 items-center rounded-full px-7 text-[16px] font-medium text-foreground">
                      {t("clear")}
                    </Link>
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
                            ? t("rating", { average: rating.average.toFixed(1), count: rating.count })
                            : undefined,
                        }}
                      />
                    ))}
                  </div>
                )}

                {totalPages > 1 && (
                  <nav className="mt-10 flex items-center justify-between gap-4" aria-label={t("pagination")}>
                    {page > 1 ? (
                      <Link
                        href={`/empresas${buildDiscoveryQuery(filters, view, { page: page - 1 > 1 ? String(page - 1) : undefined })}`}
                        className="neu inline-flex min-h-11 items-center rounded-full px-6 text-[15px] font-medium"
                      >
                        ← {t("prev")}
                      </Link>
                    ) : (
                      <span />
                    )}
                    <span className="text-[14px] text-muted">{t("pageOf", { page, total: totalPages })}</span>
                    {page < totalPages ? (
                      <Link
                        href={`/empresas${buildDiscoveryQuery(filters, view, { page: String(page + 1) })}`}
                        className="neu inline-flex min-h-11 items-center rounded-full px-6 text-[15px] font-medium"
                      >
                        {t("next")} →
                      </Link>
                    ) : (
                      <span />
                    )}
                  </nav>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <CinematicFooter />
    </>
  );
}
