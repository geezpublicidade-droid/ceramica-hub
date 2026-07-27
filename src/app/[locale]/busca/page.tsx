import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { Link } from "@/i18n/navigation";
import { searchGlobal, SEARCH_TYPE_LABEL } from "@/lib/services/global-search";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
};

// Página de resultado de busca interna: nunca deve ser indexada nem entrar
// no sitemap (regra explícita do plano do site — "não publicar resultados
// internos"). Sempre dinâmica, o termo muda a cada request.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SearchPage" });
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { q } = await searchParams;
  const term = (q ?? "").trim();

  const [t, tSearch, results] = await Promise.all([
    getTranslations("SearchPage"),
    getTranslations("GlobalSearch"),
    term ? searchGlobal(term, locale) : Promise.resolve([]),
  ]);

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="px-6 pb-16 pt-32 sm:pt-36">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-[clamp(1.5rem,3vw,2.25rem)] font-semibold leading-tight tracking-tight">
              {term ? t("heading", { term }) : t("noQuery")}
            </h1>

            {term && results.length === 0 && (
              <p className="mt-6 text-[17px] text-muted">{t("noResults", { term })}</p>
            )}

            {results.length > 0 && (
              <div className="mt-8 flex flex-col gap-2">
                {results.map((result, index) => (
                  <Link
                    key={`${result.type}-${result.title}-${index}`}
                    href={result.href}
                    className="glass-card-light flex items-center justify-between gap-3 rounded-2xl px-5 py-4 transition-colors hover:border-primary/20"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[17px] font-medium text-foreground">{result.title}</p>
                      <p className="truncate text-[14px] text-muted">{result.subtitle}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {result.sponsored && (
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[12px] font-medium text-primary">
                          {tSearch("sponsored")}
                        </span>
                      )}
                      <span className="text-[13px] text-muted">{SEARCH_TYPE_LABEL[result.type]}</span>
                    </div>
                  </Link>
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
