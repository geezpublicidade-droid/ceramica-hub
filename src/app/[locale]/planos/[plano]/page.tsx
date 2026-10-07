import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { Link } from "@/i18n/navigation";
import { PlanShowcaseCard } from "@/components/landing/PlanShowcaseCard";
import { getPublicPlans, planTexts } from "@/lib/services/plan-display";
import { localizedUrl, buildAlternates, buildSocialMetadata } from "@/lib/seo";
import { jsonLdString } from "@/lib/json-ld";

type PageProps = {
  params: Promise<{ locale: string; plano: string }>;
};

// planos novos criados no admin também têm página (dynamicParams); os de fábrica são pré-gerados
export const dynamicParams = true;
export const revalidate = 60;

export async function generateStaticParams() {
  return (await getPublicPlans()).map((plan) => ({ plano: plan.key }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { plano, locale } = await params;
  const plan = (await getPublicPlans()).find((item) => item.key === plano);
  if (!plan) return {};

  const [tDetail, texts] = await Promise.all([getTranslations({ locale, namespace: "PlanDetailPage" }), planTexts(plan, locale)]);
  const title = tDetail("metaTitle", { plan: texts.name });
  const description = tDetail("metaDescription", { plan: texts.name });

  return {
    title,
    description,
    alternates: buildAlternates(locale, `/planos/${plano}`),
    ...buildSocialMetadata({ title, description, locale, path: `/planos/${plano}` }),
  };
}

export default async function PlanoDetailPage({ params }: PageProps) {
  const { plano, locale } = await params;
  const plans = await getPublicPlans();
  const plan = plans.find((item) => item.key === plano);
  if (!plan) notFound();

  const [t, tDetail, texts] = await Promise.all([getTranslations("Pricing"), getTranslations("PlanDetailPage"), planTexts(plan, locale)]);
  const isSponsor = plan.isSponsor;
  const price = plan.priceLabel ?? t("priceOnRequest");
  const period = plan.priceLabel && plan.priceLabel !== "R$ 0" ? t("perMonth") : "";

  const index = plans.findIndex((item) => item.key === plano);
  const nextPlan = plans[index + 1] ?? null;
  const nextName = nextPlan ? (await planTexts(nextPlan, locale)).name : null;

  const canonicalUrl = localizedUrl(locale, `/planos/${plano}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: texts.name,
    description: texts.description,
    url: canonicalUrl,
    ...(isSponsor ? {} : { offers: { "@type": "Offer", priceCurrency: "BRL", price: price.replace(/\D/g, "") || "0" } }),
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
            <p className="mt-4 text-[14px] font-medium uppercase tracking-[0.2em] text-primary">{tDetail("eyebrow")}</p>
            <h1 className="mt-2 text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-tight tracking-tight">{texts.name}</h1>
            <p className="mt-3 max-w-xl text-[17px] text-muted">{texts.description}</p>
            <p className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight">{price}</span>
              <span className="text-muted">{period}</span>
            </p>
            <Link href={isSponsor ? "/seja-um-parceiro?tipo=patrocinador" : "/cadastro"} className="neu-primary mt-6 inline-block rounded-full px-6 py-3 text-[16px] font-medium text-white">
              {isSponsor ? t("ctaTalkToUs") : t("ctaChoosePlan")}
            </Link>

            <div className="mt-14 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.1fr_1fr]">
              <PlanShowcaseCard features={plan.features} />
              <div className="glass-light rounded-3xl p-6 sm:p-7">
                <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-muted">{tDetail("featuresHeading")}</p>
                <ul className="mt-4 space-y-3 text-[16px]">
                  {texts.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="text-accent">—</span>
                      <span className="text-muted">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {nextPlan && nextName && (
              <p className="mt-14 text-[16px] text-muted">
                <Link href={`/planos/${nextPlan.key}`} className="font-medium text-primary hover:underline">
                  {tDetail("nextPlanTeaser", { plan: nextName })}
                </Link>
              </p>
            )}
          </div>
        </section>
      </main>
      <CinematicFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
    </>
  );
}
