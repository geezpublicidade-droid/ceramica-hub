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
import { SearchProvider } from "@/components/landing/SearchContext";
import { AdSlot } from "@/components/ads/AdSlot";
import {
  getCategoryBreakdown,
  getAllBusinesses,
  getFeaturedBusinesses,
  getOpportunities,
  getBenefits,
} from "@/lib/services/platform";

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
          <ScaleSequence />
          <PlatformReveal
            businesses={featuredBusinesses}
            categories={categoryBreakdown.map((c) => c.category)}
          />
          <SmartSearch businesses={allBusinesses} />
          <div className="py-6">
            <AdSlot placementKey="diretorio_topo" />
          </div>
          <Directory businesses={allBusinesses} />
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
