import { Suspense } from "react";
import { Header } from "@/components/Header";
import { NetworkNarrative } from "@/components/landing/NetworkNarrative";
import { ProofOfRelevance } from "@/components/landing/ProofOfRelevance";
import { InstitutionalPartners } from "@/components/landing/InstitutionalPartners";
import { FourUniverses } from "@/components/landing/FourUniverses";
import { FeaturedBusinesses } from "@/components/landing/FeaturedBusinesses";
import { Directory } from "@/components/Directory";
import { ScaleSequence } from "@/components/landing/ScaleSequence";
import { OpportunityNetwork } from "@/components/landing/OpportunityNetwork";
import { LocalBenefits } from "@/components/landing/LocalBenefits";
import { FounderCTA } from "@/components/landing/FounderCTA";
import { PricingSummary } from "@/components/landing/PricingSummary";
import { AdvertisersCTA } from "@/components/landing/AdvertisersCTA";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { SearchProvider } from "@/components/landing/SearchContext";
import { AdBanner } from "@/components/ads/AdBanner";
import { AdCarousel } from "@/components/ads/AdCarousel";
import {
  getAllBusinesses,
  getFeaturedBusinesses,
  getOpportunities,
  getBenefits,
  getHomeProofStats,
} from "@/lib/services/platform";

// Sem isso, a página fica congelada no HTML gerado no último deploy manual
// (empresa aprovada, benefício novo, campanha de anúncio aprovada — nada
// aparece até o próximo `vercel --prod`). Mesmo raciocínio de
// empresa/[slug]/page.tsx.
export const revalidate = 60;

export default async function Preview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [allBusinesses, featuredBusinesses, opportunities, benefits, proofStats] = await Promise.all([
    getAllBusinesses(locale),
    getFeaturedBusinesses(6, locale),
    getOpportunities(locale),
    getBenefits(locale),
    getHomeProofStats(),
  ]);

  return (
    <>
      <Header />
      <main className="flex-1">
        <SearchProvider>
          {/* 1. Hero */}
          <NetworkNarrative />

          {/* 2. Prova de relevância */}
          <ProofOfRelevance stats={proofStats} />
          <InstitutionalPartners />

          {/* 3. Quatro universos */}
          <FourUniverses />

          {/* 4. Empresas em destaque + diretório completo (destino da busca do hero) */}
          <FeaturedBusinesses businesses={featuredBusinesses} />
          <Suspense fallback={null}>
            <Directory businesses={allBusinesses} />
          </Suspense>
          <AdBanner placementKey="hero_abaixo" />

          {/* 5. Sequência emocional */}
          <ScaleSequence />

          {/* 6. Benefícios e descoberta */}
          <OpportunityNetwork opportunities={opportunities} />
          <LocalBenefits benefits={benefits} />
          <div className="py-10">
            <AdCarousel placementKey="carrossel_home" />
          </div>

          {/* 7. Área para empresas */}
          <FounderCTA />

          {/* 8. Planos (resumo -- comparação completa em /planos) */}
          <PricingSummary />

          {/* 9. Anunciantes */}
          <AdvertisersCTA />
        </SearchProvider>
      </main>
      <CinematicFooter />
    </>
  );
}
