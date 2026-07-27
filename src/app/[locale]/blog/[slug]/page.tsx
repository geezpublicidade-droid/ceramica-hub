import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { getPublishedPostBySlug } from "@/lib/services/blog";
import { buildSocialMetadata } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const post = await getPublishedPostBySlug(slug, locale);
  if (!post) return { title: "Post não encontrado — Cerâmica Hub" };

  const title = `${post.title} — Cerâmica Hub`;
  const description = post.excerpt;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    ...buildSocialMetadata({
      title,
      description,
      locale,
      path: `/blog/${post.slug}`,
      type: "article",
      image: post.coverImageUrl,
    }),
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const t = await getTranslations("Blog");
  const post = await getPublishedPostBySlug(slug, locale);
  if (!post) notFound();

  return (
    <>
      <Header />
      <main className="flex-1 bg-surface px-6 pb-20 pt-32 text-foreground">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-full border-2 border-foreground/15 bg-white px-5 py-3 text-[16px] font-semibold text-foreground shadow-sm transition hover:border-foreground/30 hover:bg-foreground/5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {t("backToBlog")}
          </Link>

          {post.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.coverImageUrl} alt={post.title} className="mt-8 h-72 w-full rounded-3xl object-cover" />
          )}

          <p className="mt-8 text-[14px] text-muted">
            {post.authorName}
            {post.publishedAt &&
              ` · ${new Date(post.publishedAt).toLocaleDateString(locale === "pt" ? "pt-BR" : locale, {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}`}
          </p>
          <h1 className="mt-2 text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-tight tracking-tight">
            {post.title}
          </h1>
          <p className="mt-6 whitespace-pre-wrap text-[18px] leading-relaxed text-foreground/85">{post.content}</p>
        </div>
      </main>
      <CinematicFooter />
    </>
  );
}
