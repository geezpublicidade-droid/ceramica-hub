import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { getRecentNews } from "@/lib/services/news";

export const revalidate = 1800;

export async function generateMetadata() {
  const t = await getTranslations("Noticias");
  return { title: t("metaTitle") };
}

function timeAgo(iso: string | null): string | null {
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "há poucos minutos";
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

export default async function NoticiasPage() {
  const t = await getTranslations("Noticias");
  const news = await getRecentNews();

  return (
    <>
      <Header />
      <main className="flex-1 bg-surface px-6 py-32 text-foreground">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-[clamp(1.8rem,4vw,2.75rem)] font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-4 max-w-xl text-[17px] text-muted">{t("subtitle")}</p>

          {news.length === 0 ? (
            <p className="mt-14 text-[16px] text-muted">{t("empty")}</p>
          ) : (
            <div className="mt-14 flex flex-col gap-4">
              {news.map((item) => (
                <a
                  key={item.id}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="glass-card-light group rounded-3xl p-6 transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)]"
                >
                  <h2 className="text-[19px] font-semibold leading-snug tracking-tight group-hover:text-primary">
                    {item.title}
                  </h2>
                  <p className="mt-1.5 text-[14px] text-muted">
                    {item.sourceName ?? t("sourceLabel")}
                    {timeAgo(item.publishedAt) && ` · ${timeAgo(item.publishedAt)}`}
                  </p>
                  {item.excerpt && <p className="mt-3 text-[16px] leading-relaxed text-muted">{item.excerpt}</p>}
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-medium text-primary">
                    {t("readFull")}
                    <span aria-hidden="true">→</span>
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
      <CinematicFooter />
    </>
  );
}
