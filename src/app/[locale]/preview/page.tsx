import { Suspense } from "react";
import { Header } from "@/components/Header";
import { NetworkNarrative } from "@/components/landing/NetworkNarrative";
import { ScaleSequence } from "@/components/landing/ScaleSequence";
import { PlatformReveal } from "@/components/landing/PlatformReveal";
import { SmartSearch } from "@/components/landing/SmartSearch";
import { Directory } from "@/components/Directory";
import { OpportunityNetwork } from "@/components/landing/OpportunityNetwork";
import { LocalBenefits } from "@/components/landing/LocalBenefits";
import { CollectiveMovement } from "@/components/landing/CollectiveMovement";
import { Pricing } from "@/components/Pricing";
import { FounderCTA } from "@/components/landing/FounderCTA";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { InstitutionalPartners } from "@/components/landing/InstitutionalPartners";
import { SearchProvider } from "@/components/landing/SearchContext";
import { AdSlot } from "@/components/ads/AdSlot";
import { AdBanner } from "@/components/ads/AdBanner";
import { AdCarousel } from "@/components/ads/AdCarousel";
import {
  getCategoryBreakdown,
  getAllBusinesses,
  getFeaturedBusinesses,
  getOpportunities,
  getBenefits,
} from "@/lib/services/platform";

// Sem isso, a página fica congelada no HTML gerado no último deploy manual
// (empresa aprovada, benefício novo, campanha de anúncio aprovada — nada
// aparece até o próximo `vercel --prod`). Mesmo raciocínio de
// empresa/[slug]/page.tsx.
export const revalidate = 60;

export default async function Preview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [categoryBreakdown, allBusinesses, featuredBusinesses, opportunities, benefits] =
    await Promise.all([
      getCategoryBreakdown(),
      getAllBusinesses(locale),
      getFeaturedBusinesses(undefined, locale),
      getOpportunities(locale),
      getBenefits(locale),
    ]);

  return (
    <>
      <Header />
      <main className="flex-1">
        <SearchProvider>
          <NetworkNarrative />
          <InstitutionalPartners />
          <AdBanner placementKey="hero_abaixo" />
          <div className="py-10">
            <AdCarousel placementKey="carrossel_home" />
          </div>
          <ScaleSequence />
          <PlatformReveal
            businesses={featuredBusinesses}
            categories={categoryBreakdown.map((c) => c.category)}
          />
          <SmartSearch businesses={allBusinesses} />
          <div className="py-6">
            <AdSlot placementKey="diretorio_topo" />
          </div>
          <Suspense fallback={null}>
            <Directory businesses={allBusinesses} />
          </Suspense>
          <OpportunityNetwork opportunities={opportunities} />
          <LocalBenefits benefits={benefits} />
          <CollectiveMovement />
          <Pricing />
          <FounderCTA />
        </SearchProvider>
      </main>
      <CinematicFooter />
    </>
  );
}
