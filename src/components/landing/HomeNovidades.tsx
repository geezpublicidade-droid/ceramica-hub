import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FadeUp } from "@/components/motion/FadeUp";
import type { NewsItem } from "@/lib/services/news";

function timeAgo(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(new Date(iso));
}

/** Coluna lateral de notícias de São Caetano do Sul (ver getRecentNews, RSS
 * do Google News) -- fica ao lado dos blocos de destaque em vez de ocupar
 * uma faixa própria. Sem foto por item porque o feed não traz imagem --
 * evita inventar uma capa genérica pra cada notícia. */
export async function NewsCorner({ news, locale }: { news: NewsItem[]; locale: string }) {
  const t = await getTranslations("HomeNovidades");

  return (
    <FadeUp className="h-full">
      <aside id="novidades" className="flex h-full flex-col rounded-2xl border border-border bg-white p-6">
        <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-primary">{t("eyebrow")}</p>
        <h2 className="mt-2 text-[clamp(1.3rem,2vw,1.6rem)] font-semibold leading-tight tracking-tight">
          {t("headline")}
        </h2>

        <ul className="mt-4 flex flex-1 flex-col divide-y divide-border">
          {news.map((item) => (
            <li key={item.id}>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group block py-3"
              >
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                  {item.sourceName ?? t("eyebrow")}
                  {item.publishedAt && ` · ${timeAgo(item.publishedAt, locale)}`}
                </p>
                <p className="mt-1 line-clamp-2 text-[14px] font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
                  {item.title}
                </p>
              </a>
            </li>
          ))}
        </ul>

        <Link
          href="/noticias"
          className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-medium text-primary transition-transform hover:translate-x-1"
        >
          {t("cta")} →
        </Link>
      </aside>
    </FadeUp>
  );
}
