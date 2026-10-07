import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import type { Business } from "@/data/businesses";
import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { LandingPageEmpresa } from "@/components/landing-empresa/LandingPageEmpresa";
import { PlanSimulatorBar } from "@/components/landing-empresa/PlanSimulatorBar";
import { localizedUrl } from "@/lib/seo";
import { buildLandingContext } from "@/lib/services/landing-context";
import { getBusinessBySlug } from "@/lib/services/platform";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ plano?: string; exemplo?: string }>;
};

const PLANS: Business["plan"][] = ["presenca", "profissional", "destaque", "experiencia", "premium"];

// pré-visualização do rascunho: depende da sessão, nunca é cacheada nem indexada
export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Pré-visualização da landing com o rascunho. Só a própria empresa e administradores veem; qualquer outra pessoa recebe 404.
 * `?plano=` simula as regras de outro plano e `?exemplo=1` completa o que falta com conteúdo de exemplo — nada é gravado.
 */
export default async function LandingPreviewPage({ params, searchParams }: PageProps) {
  const { slug, locale } = await params;
  const query = await searchParams;
  const business = await getBusinessBySlug(slug, locale);
  if (!business) notFound();

  const session = await auth();
  const allowed = session?.user?.role === "admin" || session?.user?.businessId === business.id;
  if (!allowed) notFound();

  const simulatedPlan = PLANS.find((plan) => plan === query.plano) ?? null;
  const demo = query.exemplo === "1";
  const tCategories = await getTranslations("categories");
  const ctx = await buildLandingContext(business, localizedUrl(locale, `/empresa/${business.slug}`), tCategories(business.category), {
    locale,
    allowDraft: true,
    simulatePlan: simulatedPlan ?? undefined,
    demoContent: demo,
  });

  return (
    <>
      <Header />
      <PlanSimulatorBar
        basePath={`/empresa/${business.slug}/preview`}
        realPlan={business.effectivePlan}
        simulatedPlan={simulatedPlan}
        demo={demo}
        draft={ctx.data.config.status === "draft"}
      />
      <main className="flex-1 pt-10">
        <LandingPageEmpresa ctx={ctx} />
      </main>
      <CinematicFooter />
    </>
  );
}
