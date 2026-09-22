import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FadeUp } from "@/components/motion/FadeUp";
import { getRecentNews } from "@/lib/services/news";

function timeAgo(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(new Date(iso));
}

/** "Novidades" -- agregador de notícias reais (ver getRecentNews, RSS do
 * Google News), sem foto por item porque o feed não traz imagem -- evita
 * inventar uma capa genérica pra cada notícia. */
export async function HomeNovidades({ locale }: { locale: string }) {
  const [t, news] = await Promise.all([getTranslations("HomeNovidades"), getRecentNews(3)]);
  if (news.length === 0) return null;

  return (
    <section id="novidades" className="section-pad-y bg-white text-foreground">
      <div className="container-page grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,2.2fr)] lg:gap-[clamp(32px,5vw,72px)]">
        <FadeUp>
          <p className="text-[15px] font-medium uppercase tracking-[0.2em] text-primary">{t("eyebrow")}</p>
          <h2 className="mt-3 text-[clamp(1.8rem,3.2vw,2.5rem)] font-semibold leading-tight tracking-tight">
            {t("headline")}
          </h2>
          <Link
            href="/noticias"
            className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-primary transition-transform hover:translate-x-1"
          >
            {t("cta")} →
          </Link>
        </FadeUp>

        <div className="grid grid-cols-1 gap-[var(--card-gap)] sm:grid-cols-3">
          {news.map((item) => (
            <FadeUp key={item.id}>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-5"
              >
                <p className="text-[12px] font-medium uppercase tracking-wide text-muted">
                  {item.sourceName ?? t("eyebrow")}
                </p>
                <h3 className="mt-2 line-clamp-2 flex-1 text-[16px] font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
                  {item.title}
                </h3>
                {item.publishedAt && (
                  <p className="mt-3 text-[13px] text-muted">{timeAgo(item.publishedAt, locale)}</p>
                )}
              </a>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
