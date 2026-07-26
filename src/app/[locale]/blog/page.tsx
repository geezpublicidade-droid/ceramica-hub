import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { getPublishedPosts } from "@/lib/services/blog";

export const revalidate = 60;

export async function generateMetadata() {
  const t = await getTranslations("Blog");
  return { title: t("metaTitle") };
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("Blog");
  const posts = await getPublishedPosts(locale);

  return (
    <>
      <Header />
      <main className="flex-1 bg-surface px-6 py-32 text-foreground">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-[clamp(1.8rem,4vw,2.75rem)] font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-4 max-w-xl text-[17px] text-muted">{t("subtitle")}</p>

          {posts.length === 0 ? (
            <p className="mt-14 text-[16px] text-muted">{t("empty")}</p>
          ) : (
            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="glass-card-light group flex flex-col overflow-hidden rounded-3xl transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)]"
                >
                  {post.coverImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.coverImageUrl} alt={post.title} className="h-48 w-full object-cover" />
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-[13px] text-muted">
                      {post.publishedAt &&
                        new Date(post.publishedAt).toLocaleDateString(locale === "pt" ? "pt-BR" : locale, {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                    </p>
                    <h2 className="mt-2 text-[19px] font-semibold leading-snug tracking-tight group-hover:text-primary">
                      {post.title}
                    </h2>
                    <p className="mt-3 flex-1 text-[16px] leading-relaxed text-muted">{post.excerpt}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-medium text-primary">
                      {t("readMore")}
                      <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <CinematicFooter />
    </>
  );
}
