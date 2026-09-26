import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FadeUp } from "@/components/motion/FadeUp";
import type { NewsItem } from "@/lib/services/news";
import type { BusinessEvent } from "@/lib/services/events";

function shortDate(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(new Date(iso));
}

type CityAndNewsProps = {
  news: NewsItem[];
  events: BusinessEvent[];
  locale: string;
};

type Card = { key: string; badge: string; title: string; meta: string | null; href: string; external: boolean };

/** Editorial 1/3 + 2/3: à esquerda o texto sobre São Caetano do Sul; à direita
 * "Acontece no Cerâmica" -- eventos cadastrados de verdade primeiro, depois
 * notícias reais (getRecentNews, RSS). Nada inventado: sem evento nem
 * notícia, a coluna direita some e o texto da cidade ocupa a largura. */
export async function CityAndNews({ news, events, locale }: CityAndNewsProps) {
  const t = await getTranslations("CityAndNews");

  const cards: Card[] = [
    ...events.slice(0, 2).map((event) => ({
      key: `event-${event.id}`,
      badge: t("eventBadge"),
      title: event.title,
      meta: shortDate(event.startsAt, locale),
      href: "/forum-de-negocios",
      external: false,
    })),
    ...news.map((item) => ({
      key: `news-${item.id}`,
      badge: item.sourceName ?? t("newsBadge"),
      title: item.title,
      meta: shortDate(item.publishedAt, locale),
      href: item.link,
      external: true,
    })),
  ].slice(0, 3);

  return (
    <section id="novidades" className="section-pad-y bg-white text-foreground">
      <div
        className={`container-page grid grid-cols-1 items-start gap-10 ${
          cards.length > 0 ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-[clamp(32px,5vw,72px)]" : ""
        }`}
      >
        <FadeUp>
          <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-primary">{t("cityEyebrow")}</p>
          <h2 className="mt-3 text-[clamp(1.6rem,2.8vw,2.2rem)] font-semibold leading-tight tracking-tight">
            {t("cityHeadline")}
          </h2>
          <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted">{t("cityText")}</p>
          <Link
            href="/noticias"
            className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-primary transition-transform hover:translate-x-1"
          >
            {t("cityCta")} →
          </Link>
        </FadeUp>

        {cards.length > 0 && (
          <div>
            <FadeUp className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-primary">{t("newsEyebrow")}</p>
                <h2 className="mt-3 text-[clamp(1.6rem,2.8vw,2.2rem)] font-semibold leading-tight tracking-tight">
                  {t("newsHeadline")}
                </h2>
              </div>
              <Link
                href="/noticias"
                className="text-[14px] font-medium text-primary transition-transform hover:translate-x-1"
              >
                {t("newsCta")} →
              </Link>
            </FadeUp>

            <div className="mt-6 grid grid-cols-1 gap-[var(--card-gap)] sm:grid-cols-3">
              {cards.map((card) => (
                <FadeUp key={card.key} className="h-full">
                  {card.external ? (
                    <a
                      href={card.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-5"
                    >
                      <CardBody card={card} />
                    </a>
                  ) : (
                    <Link
                      href={card.href}
                      className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-5"
                    >
                      <CardBody card={card} />
                    </Link>
                  )}
                </FadeUp>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function CardBody({ card }: { card: Card }) {
  return (
    <>
      <p className="text-[12px] font-medium uppercase tracking-wide text-muted">{card.badge}</p>
      <h3 className="mt-2 line-clamp-3 flex-1 text-[16px] font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
        {card.title}
      </h3>
      {card.meta && <p className="mt-3 text-[13px] text-muted">{card.meta}</p>}
    </>
  );
}
