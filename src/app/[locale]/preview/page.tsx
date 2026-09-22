import { Suspense } from "react";
import { Header } from "@/components/Header";
import { NetworkNarrative } from "@/components/landing/NetworkNarrative";
import { ProofOfRelevance } from "@/components/landing/ProofOfRelevance";
import { InstitutionalPartners } from "@/components/landing/InstitutionalPartners";
import { FourUniverses } from "@/components/landing/FourUniverses";
import { FeaturedBusinesses } from "@/components/landing/FeaturedBusinesses";
import { Directory } from "@/components/Directory";
import { DestaqueBlocks } from "@/components/landing/DestaqueBlocks";
import { HomeNovidades } from "@/components/landing/HomeNovidades";
import { OpportunityNetwork } from "@/components/landing/OpportunityNetwork";
import { LocalBenefits } from "@/components/landing/LocalBenefits";
import { FounderCTA } from "@/components/landing/FounderCTA";
import { PricingSummary } from "@/components/landing/PricingSummary";
import { AdvertisersCTA } from "@/components/landing/AdvertisersCTA";
import { UtilityStrip } from "@/components/landing/UtilityStrip";
import { PremiumSponsorsCarousel } from "@/components/landing/PremiumSponsorsCarousel";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { SearchProvider } from "@/components/landing/SearchContext";
import { AdBanner } from "@/components/ads/AdBanner";
import { AdCarousel } from "@/components/ads/AdCarousel";
import { getActiveTowers } from "@/lib/services/towers";
import { getActivePartners } from "@/lib/services/institutional-partners";
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

// Heurística simples pra não vazar registro de teste ("Padaria Teste
// Estrutura" etc.) pra vitrine da home -- não existe flag is_test no banco
// ainda; até existir, filtra pelo nome. Não afeta o Diretório completo
// (getAllBusinesses), só a seção "Negócios em destaque".
const TEST_RECORD_RE = /\bteste\b/i;

export default async function Preview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [allBusinesses, featuredBusinessesRaw, opportunities, benefits, proofStats, towers, partners] =
    await Promise.all([
      getAllBusinesses(locale),
      getFeaturedBusinesses(9, locale),
      getOpportunities(locale),
      getBenefits(locale),
      getHomeProofStats(),
      getActiveTowers(),
      getActivePartners(),
    ]);
  const featuredBusinesses = featuredBusinessesRaw.filter((b) => !TEST_RECORD_RE.test(b.name)).slice(0, 6);
  const directoryBusinesses = allBusinesses.filter((b) => !TEST_RECORD_RE.test(b.name));

  return (
    <>
      <Header />
      <main className="flex-1">
        <SearchProvider>
          {/* 1. Hero -- estático, painel das torres reais à direita (desktop) */}
          <NetworkNarrative towers={towers} sponsorsSlot={<PremiumSponsorsCarousel partners={partners} />} />

          {/* 2. Faixa de categorias */}
          <FourUniverses />

          {/* 3. Negócios em destaque + diretório completo (destino da busca do hero) */}
          <FeaturedBusinesses businesses={featuredBusinesses} />
          <Suspense fallback={null}>
            <Directory businesses={directoryBusinesses} />
          </Suspense>
          <AdBanner placementKey="hero_abaixo" />

          {/* 4. Eventos / Âncoras institucionais / O Complexo */}
          <DestaqueBlocks />

          {/* 5. Prova de relevância + marcas participantes */}
          <ProofOfRelevance stats={proofStats} />
          <InstitutionalPartners />

          {/* 6. Novidades (agregador de notícias reais) */}
          <HomeNovidades locale={locale} />

          {/* 7. Oportunidades e benefícios da rede (funcionalidades existentes) */}
          <OpportunityNetwork opportunities={opportunities} />
          <LocalBenefits benefits={benefits} />
          <div className="py-10">
            <AdCarousel placementKey="carrossel_home" />
          </div>

          {/* 8. Área para empresas */}
          <FounderCTA />

          {/* 9. Planos (resumo -- comparação completa em /planos) */}
          <PricingSummary />

          {/* 10. Anunciantes */}
          <AdvertisersCTA />

          {/* 11. Bloco final de utilidade -- mapa, como chegar, fale conosco, cadastro */}
          <UtilityStrip towers={towers} />
        </SearchProvider>
      </main>
      <CinematicFooter />
    </>
  );
}
