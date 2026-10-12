import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { AdHereBanner } from "@/components/ads/AdHereBanner";
import { AnchorStoreExplorer } from "@/components/anchor/AnchorStoreExplorer";
import { Link } from "@/i18n/navigation";
import { getAnchorPosts, getPublicAnchorBySlug, getPublicStores, type AnchorPost, type AnchorPartner } from "@/lib/services/anchors";
import { safeHref } from "@/lib/category-page";
import { buildAlternates, buildSocialMetadata } from "@/lib/seo";
import { formatDateBR, whatsappUrl } from "@/lib/utils";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export const revalidate = 60;

const MAX_FEATURED_STORES = 6;
const BADGE_KEY: Record<string, "founderBadge" | "premiumBadge" | "partnerBadge"> = {
  ancora_fundadora: "founderBadge",
  parceiro_premium: "premiumBadge",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const partner = await getPublicAnchorBySlug(slug);
  if (!partner) return {};

  const t = await getTranslations({ locale, namespace: "AnchorPage" });
  const title = t("metaTitle", { name: partner.name });
  const description = partner.tagline ?? partner.description ?? partner.partnershipType;
  return {
    title,
    description,
    // Âncora de demonstração nunca é indexada.
    robots: partner.isDemo ? { index: false, follow: false } : undefined,
    alternates: buildAlternates(locale, `/parceiros/${slug}`),
    ...buildSocialMetadata({ title, description, locale, path: `/parceiros/${slug}`, type: "website" }),
  };
}

function SectionHeading({ eyebrow, title, note }: { eyebrow: string; title: string; note?: string }) {
  return (
    <div>
      <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-[clamp(1.5rem,2.6vw,2rem)] font-semibold leading-tight tracking-tight text-foreground">{title}</h2>
      {note && <p className="mt-2 max-w-2xl text-[15px] text-muted">{note}</p>}
    </div>
  );
}

function PostCard({ post }: { post: AnchorPost }) {
  const link = post.link ? safeHref(post.link, "") : null;
  const content = (
    <article className="glass-card-light h-full overflow-hidden rounded-2xl">
      {post.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.imageUrl} alt="" className="h-40 w-full object-cover" />
      )}
      <div className="p-5">
        {post.happensOn && <p className="text-[13px] font-medium text-primary">{formatDateBR(post.happensOn)}</p>}
        <h3 className="mt-1 text-[17px] font-semibold text-foreground">{post.title}</h3>
        {post.body && <p className="mt-2 text-[15px] text-foreground/80">{post.body}</p>}
      </div>
    </article>
  );
  return link?.href ? (
    <a href={link.href} {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="block h-full">
      {content}
    </a>
  ) : (
    content
  );
}

function PostSection({ posts, eyebrow, title }: { posts: AnchorPost[]; eyebrow: string; title: string }) {
  if (posts.length === 0) return null;
  return (
    <section className="mt-16">
      <SectionHeading eyebrow={eyebrow} title={title} />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}

function ContactActions({ partner, labels }: { partner: AnchorPartner; labels: { directions: string; site: string; whatsapp: string } }) {
  const directions = partner.directionsUrl ? safeHref(partner.directionsUrl, "") : null;
  const site = partner.link ? safeHref(partner.link, "") : null;
  const buttonClass = "rounded-full px-5 py-2.5 text-[14px] font-medium";
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {directions?.href && (
        <a href={directions.href} target="_blank" rel="noopener noreferrer" className={`${buttonClass} liquid-dark text-white`}>
          {labels.directions}
        </a>
      )}
      {site?.href && (
        <a href={site.href} target="_blank" rel="noopener noreferrer" className={`${buttonClass} border border-white/50 text-white hover:bg-white/10`}>
          {labels.site}
        </a>
      )}
      {partner.whatsapp && (
        <a href={whatsappUrl(partner.whatsapp)} target="_blank" rel="noopener noreferrer" className={`${buttonClass} border border-white/50 text-white hover:bg-white/10`}>
          {labels.whatsapp}
        </a>
      )}
    </div>
  );
}

export default async function AnchorPartnerPublicPage({ params }: PageProps) {
  const { slug } = await params;
  const partner = await getPublicAnchorBySlug(slug);
  if (!partner) notFound();

  const [t, stores, posts] = await Promise.all([
    getTranslations("AnchorPage"),
    getPublicStores(partner.id),
    getAnchorPosts(partner.id, { onlyActive: true }),
  ]);
  const featured = stores.filter((store) => store.highlighted).slice(0, MAX_FEATURED_STORES);
  const badge = t(BADGE_KEY[partner.tier] ?? "partnerBadge");
  const info = [
    partner.address && { label: t("address"), value: partner.address },
    partner.openingHours && { label: t("hours"), value: partner.openingHours },
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <>
      <Header />
      <main className="flex-1">
        {partner.isDemo && (
          <div className="bg-primary px-6 pb-2.5 pt-[88px] text-center text-[13px] font-medium text-white sm:pt-24">
            {t("demoBanner")}
          </div>
        )}

        <section className={`relative isolate overflow-hidden bg-graphite pb-14 text-white ${partner.isDemo ? "pt-12" : "pt-32 sm:pt-36"}`}>
          {partner.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={partner.coverUrl} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45" />
          )}
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          <div className="container-page">
            <Link href="/parceiros" className="text-[15px] text-white/75 hover:text-white">
              ← {t("backToPartners")}
            </Link>
            <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
              {partner.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={partner.logoUrl} alt={partner.name} className="h-20 w-auto rounded-2xl bg-white px-5 py-3 object-contain shadow-lg" />
              )}
              <div>
                <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-[12px] font-medium uppercase tracking-[0.15em] backdrop-blur">
                  {badge}
                </span>
                <h1 className="mt-3 text-[clamp(2rem,4.4vw,3.4rem)] font-semibold leading-[1.1] tracking-tight">{partner.name}</h1>
                {partner.tagline && <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-white/85">{partner.tagline}</p>}
              </div>
            </div>
            <ContactActions partner={partner} labels={{ directions: t("directions"), site: t("officialSite"), whatsapp: t("whatsapp") }} />
          </div>
        </section>

        {info.length > 0 && (
          <section className="border-b border-border bg-white">
            <dl className="container-page grid grid-cols-1 gap-6 py-6 sm:grid-cols-2">
              {info.map((item) => (
                <div key={item.label}>
                  <dt className="text-[12px] font-medium uppercase tracking-[0.15em] text-muted">{item.label}</dt>
                  <dd className="mt-1 text-[15px] text-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <div className="container-page pb-20 pt-14">
          {featured.length > 0 && (
            <section>
              <SectionHeading eyebrow={t("featuredEyebrow")} title={t("featuredTitle")} note={t("featuredNote", { name: partner.name })} />
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((store) => (
                  <article key={store.id} className="flex min-h-[200px] flex-col justify-between rounded-3xl border-t-4 border-primary bg-graphite p-6 text-white shadow-lg">
                    <div>
                      <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[12px] font-medium">{store.segment}</span>
                      <h3 className="mt-4 text-[22px] font-semibold leading-tight">{store.name}</h3>
                      {store.description && <p className="mt-2 text-[15px] leading-relaxed text-white/80">{store.description}</p>}
                    </div>
                    {store.floor && <p className="mt-4 text-[14px] text-white/70">{store.floor}</p>}
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="mt-16">
            <SectionHeading eyebrow={t("storesEyebrow")} title={t("storesHeading")} />
            <div className="mt-6">
              <AnchorStoreExplorer
                stores={stores.map(({ id, name, segment, floor, description, instagram, website, highlighted }) => ({ id, name, segment, floor, description, instagram, website, highlighted }))}
                labels={{ all: t("all"), highlight: t("highlight"), visitSite: t("visitSite"), empty: t("emptyStores") }}
              />
            </div>
          </section>

          <PostSection posts={posts.filter((post) => post.kind !== "novidade")} eyebrow={t("eventsEyebrow")} title={t("eventsTitle")} />
          <PostSection posts={posts.filter((post) => post.kind === "novidade")} eyebrow={t("newsEyebrow")} title={t("newsTitle")} />

          {partner.about && (
            <section className="mt-16 max-w-3xl">
              <SectionHeading eyebrow={t("aboutEyebrow")} title={t("aboutTitle", { name: partner.name })} />
              <p className="mt-4 text-[17px] leading-relaxed text-muted">{partner.about}</p>
            </section>
          )}

          <section className="glass-card-light mt-16 rounded-3xl p-8 sm:p-10">
            <h2 className="text-[clamp(1.4rem,2.4vw,1.8rem)] font-semibold tracking-tight text-foreground">{t("ctaTitle")}</h2>
            <p className="mt-2 max-w-2xl text-[16px] text-muted">{t("ctaText", { name: partner.name })}</p>
            <Link href="/contato" className="neu-primary mt-5 inline-block rounded-full px-6 py-3 text-[15px] font-medium text-white">
              {t("ctaButton")}
            </Link>
          </section>

          <p className="mt-8 text-[13px] text-muted">{t("governance", { name: partner.name })}</p>
        </div>
        <AdHereBanner />
      </main>
      <CinematicFooter />
    </>
  );
}
