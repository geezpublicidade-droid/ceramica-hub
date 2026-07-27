"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { categories, type Business } from "@/data/businesses";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { matchBusinesses } from "@/lib/search";
import { useSearch } from "@/components/landing/SearchContext";
import { BusinessAvatar } from "@/components/BusinessAvatar";

type DirectoryProps = {
  businesses: Business[];
};

export function Directory({ businesses }: DirectoryProps) {
  const t = useTranslations("Directory");
  const tCategories = useTranslations("categories");
  const tCommon = useTranslations("Common");
  const searchParams = useSearchParams();
  const categoriaParam = searchParams.get("categoria");
  const initialCategory = categoriaParam && (categories as readonly string[]).includes(categoriaParam) ? categoriaParam : "Todas";
  const [active, setActive] = useState<string>(initialCategory);
  const { query, setQuery } = useSearch();

  const filtered = useMemo(() => {
    const byCategory = active === "Todas" ? businesses : businesses.filter((b) => b.category === active);
    return query && query !== "__oportunidades__" ? matchBusinesses(query, byCategory) : byCategory;
  }, [active, businesses, query]);

  return (
    <section id="empresas" className="relative overflow-hidden bg-surface px-6 py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-0 h-[420px] w-[420px] rounded-full opacity-30 blur-[120px]"
        style={{ background: "radial-gradient(circle, var(--primary-light), transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-tight tracking-tight">
              {t("title")}
            </h2>
            <p className="mt-3 max-w-md text-[17px] text-muted">{t("subtitle")}</p>
          </div>
        </div>

        {query && query !== "__oportunidades__" && (
          <div className="mt-6 flex items-center gap-2 text-[15px] text-muted">
            {t("filteringBy")} <span className="font-medium text-foreground">“{query}”</span>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-full border border-border px-2.5 py-0.5 text-[14px] hover:bg-white"
            >
              {t("clear")}
            </button>
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActive(category)}
              className={`rounded-full px-5 py-2.5 text-[16px] font-medium transition-colors ${
                active === category
                  ? "neu-pressed bg-surface text-primary"
                  : "neu text-muted hover:text-foreground"
              }`}
            >
              {tCategories(category)}
            </button>
          ))}
        </div>

        {businesses.length === 0 ? (
          <div className="relative mt-14 overflow-hidden rounded-3xl border border-border bg-white/60 px-6 py-16 text-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-0 h-[280px] w-[280px] -translate-x-1/2 rounded-full opacity-40 blur-[110px]"
              style={{ background: "radial-gradient(circle, var(--primary-light), transparent 70%)" }}
            />
            <div className="relative mx-auto max-w-xl">
              <h3 className="text-[clamp(1.4rem,3vw,1.9rem)] font-semibold tracking-tight text-foreground">
                {t("emptyTitle")}
              </h3>
              <p className="mt-4 text-[17px] leading-relaxed text-muted">{t("emptyDescription")}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  href="/cadastro"
                  className="neu-primary rounded-full px-7 py-3.5 text-[17px] font-medium text-white"
                >
                  {t("ctaRegisterFree")}
                </Link>
                <a href="#planos" className="neu rounded-full px-7 py-3.5 text-[17px] font-medium text-foreground">
                  {t("ctaHowItWorks")}
                </a>
              </div>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-14 rounded-3xl border border-border bg-white/60 px-6 py-14 text-center">
            <p className="text-[17px] text-foreground">{t("noResultsTitle")}</p>
            <p className="mt-2 text-[16px] text-muted">{t("noResultsDescription")}</p>
            <Link
              href="/cadastro"
              className="mt-6 inline-block rounded-full neu px-6 py-3 text-[16px] font-medium text-foreground"
            >
              {t("ctaIndicate")}
            </Link>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((business) => (
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
                      <h3 className="text-[20px] font-semibold leading-snug tracking-tight hover:text-primary">
                        {business.name}
                      </h3>
                    </Link>
                    <div className="flex shrink-0 items-center gap-1.5">
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
                  </div>
                  <p className="mt-1.5 text-[16px] text-muted">
                    {tCategories(business.category)} · {business.floor}
                  </p>
                  <p className="mt-3 text-[17px] leading-relaxed text-muted">{business.description}</p>
                  <a
                    href={buildWhatsAppLink(business.phone, business.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-[16px] font-medium text-primary transition-transform hover:translate-x-1"
                  >
                    {tCommon("whatsapp")}
                    <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
