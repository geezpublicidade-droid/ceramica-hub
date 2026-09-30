import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { Link } from "@/i18n/navigation";
import { getPublicAnchorBySlug, getPublicStores } from "@/lib/services/anchors";
import { buildAlternates, buildSocialMetadata } from "@/lib/seo";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const partner = await getPublicAnchorBySlug(slug);
  if (!partner) return {};

  const t = await getTranslations({ locale, namespace: "AnchorPage" });
  const title = t("metaTitle", { name: partner.name });
  const description = partner.description ?? partner.partnershipType;
  return {
    title,
    description,
    alternates: buildAlternates(locale, `/parceiros/${slug}`),
    ...buildSocialMetadata({ title, description, locale, path: `/parceiros/${slug}`, type: "website" }),
  };
}

function instagramUrl(handle: string): string {
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}

export default async function AnchorPartnerPublicPage({ params }: PageProps) {
  const { slug } = await params;
  const partner = await getPublicAnchorBySlug(slug);
  if (!partner) notFound();

  const [t, stores] = await Promise.all([getTranslations("AnchorPage"), getPublicStores(partner.id)]);

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="px-6 pb-16 pt-32 sm:pt-36">
          <div className="mx-auto max-w-4xl">
            <Link href="/parceiros" className="text-[15px] text-muted hover:text-foreground">
              ← {t("backToPartners")}
            </Link>

            {partner.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={partner.coverUrl} alt={partner.name} className="mt-6 h-56 w-full rounded-3xl object-cover" />
            )}

            <div className="mt-8 flex items-center gap-4">
              {partner.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={partner.logoUrl} alt="" className="h-14 w-auto object-contain" />
              )}
              <div>
                <h1 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-tight tracking-tight">{partner.name}</h1>
                <p className="text-[15px] text-muted">{partner.partnershipType}</p>
              </div>
            </div>
            {partner.description && <p className="mt-4 max-w-2xl text-[17px] text-muted">{partner.description}</p>}

            <h2 className="mt-12 text-[13px] font-medium uppercase tracking-[0.2em] text-primary">{t("storesHeading")}</h2>
            {stores.length === 0 ? (
              <p className="mt-4 text-[16px] text-muted">{t("emptyStores")}</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {stores.map((store) => (
                  <div key={store.id} className="glass-card-light rounded-2xl p-6">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[17px] font-semibold text-foreground">{store.name}</p>
                      {store.highlighted && (
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[12px] font-medium text-primary">{t("highlight")}</span>
                      )}
                    </div>
                    <p className="text-[14px] text-muted">{[store.segment, store.floor].filter(Boolean).join(" · ")}</p>
                    {store.description && <p className="mt-2 text-[15px] text-foreground/80">{store.description}</p>}
                    <div className="mt-3 flex gap-4 text-[14px] font-medium">
                      {store.instagram && (
                        <a href={instagramUrl(store.instagram)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          Instagram
                        </a>
                      )}
                      {store.website && (
                        <a href={store.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {t("visitSite")}
                        </a>
                      )}
                    </div>
                  </div>
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
