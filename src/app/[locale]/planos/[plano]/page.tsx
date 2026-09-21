import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { Link } from "@/i18n/navigation";
import { PlanShowcaseCard } from "@/components/landing/PlanShowcaseCard";
import { PLAN_ORDER, PLAN_PRICE_DISPLAY } from "@/lib/plan-limits";
import { localizedUrl, buildSocialMetadata } from "@/lib/seo";
import type { Business } from "@/data/businesses";

type PlanoSlug = Business["plan"] | "patrocinador";

const PLANO_SLUGS: PlanoSlug[] = [...PLAN_ORDER, "patrocinador"];

function isPlanoSlug(value: string): value is PlanoSlug {
  return (PLANO_SLUGS as string[]).includes(value);
}

type PageProps = {
  params: Promise<{ locale: string; plano: string }>;
};

export async function generateStaticParams() {
  return PLANO_SLUGS.map((plano) => ({ plano }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { plano, locale } = await params;
  if (!isPlanoSlug(plano)) return {};

  const [t, tDetail] = await Promise.all([
    getTranslations({ locale, namespace: "Pricing" }),
    getTranslations({ locale, namespace: "PlanDetailPage" }),
  ]);
  const planName = t(`plans.${plano}.name`);
  const title = tDetail("metaTitle", { plan: planName });
  const description = tDetail("metaDescription", { plan: planName });

  return {
    title,
    description,
    alternates: { canonical: `/planos/${plano}` },
    ...buildSocialMetadata({ title, description, locale, path: `/planos/${plano}` }),
  };
}

export default async function PlanoDetailPage({ params }: PageProps) {
  const { plano, locale } = await params;
  if (!isPlanoSlug(plano)) notFound();

  const [t, tDetail] = await Promise.all([getTranslations("Pricing"), getTranslations("PlanDetailPage")]);

  const name = t(`plans.${plano}.name`);
  const description = t(`plans.${plano}.description`);
  const features = t.raw(`plans.${plano}.features`) as string[];
  const isSponsor = plano === "patrocinador";
  const { price, period } = isSponsor
    ? { price: t("priceOnRequest"), period: "" }
    : { price: PLAN_PRICE_DISPLAY[plano].price, period: PLAN_PRICE_DISPLAY[plano].hasPeriod ? t("perMonth") : "" };

  const planIndex = isSponsor ? -1 : PLAN_ORDER.indexOf(plano);
  const nextPlan: PlanoSlug | null = isSponsor
    ? null
    : planIndex < PLAN_ORDER.length - 1
      ? PLAN_ORDER[planIndex + 1]
      : "patrocinador";

  const canonicalUrl = localizedUrl(locale, `/planos/${plano}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    url: canonicalUrl,
    ...(isSponsor
      ? {}
      : { offers: { "@type": "Offer", priceCurrency: "BRL", price: price.replace(/\D/g, "") || "0" } }),
  };

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-surface px-6 pb-20 pt-32 sm:pt-36">
          <div className="relative mx-auto max-w-5xl">
            <Link href="/planos" className="text-[14px] font-medium text-primary hover:underline">
              {tDetail("backToAll")}
            </Link>
            <p className="mt-4 text-[14px] font-medium uppercase tracking-[0.2em] text-primary">
              {tDetail("eyebrow")}
            </p>
            <h1 className="mt-2 text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-tight tracking-tight">
              {name}
            </h1>
            <p className="mt-3 max-w-xl text-[17px] text-muted">{description}</p>
            <p className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight">{price}</span>
              <span className="text-muted">{period}</span>
            </p>
            <Link
              href={isSponsor ? "/seja-um-parceiro" : "/cadastro"}
              className="neu-primary mt-6 inline-block rounded-full px-6 py-3 text-[16px] font-medium text-white"
            >
              {isSponsor ? t("ctaTalkToUs") : t("ctaChoosePlan")}
            </Link>

            <div className="mt-14 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.1fr_1fr]">
              {!isSponsor && <PlanShowcaseCard plan={plano} />}
              <div className={`glass-light rounded-3xl p-6 sm:p-7 ${isSponsor ? "lg:col-span-2" : ""}`}>
                <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-muted">
                  {tDetail("featuresHeading")}
                </p>
                <ul className="mt-4 space-y-3 text-[16px]">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="text-accent">—</span>
                      <span className="text-muted">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {nextPlan && (
              <p className="mt-14 text-[16px] text-muted">
                <Link href={`/planos/${nextPlan}`} className="font-medium text-primary hover:underline">
                  {tDetail("nextPlanTeaser", { plan: t(`plans.${nextPlan}.name`) })}
                </Link>
              </p>
            )}
          </div>
        </section>
      </main>
      <CinematicFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
