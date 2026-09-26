import { Suspense } from "react";
import { Header } from "@/components/Header";
import { NetworkNarrative } from "@/components/landing/NetworkNarrative";
import { ProofOfRelevance } from "@/components/landing/ProofOfRelevance";
import { InstitutionalPartners } from "@/components/landing/InstitutionalPartners";
import { FourUniverses } from "@/components/landing/FourUniverses";
import { FeaturedBusinesses } from "@/components/landing/FeaturedBusinesses";
import { Directory } from "@/components/Directory";
import { DestaqueBlocks } from "@/components/landing/DestaqueBlocks";
import { CityAndNews } from "@/components/landing/HomeNovidades";
import { InstitutionalStatement } from "@/components/landing/InstitutionalStatement";
import { OpportunityNetwork } from "@/components/landing/OpportunityNetwork";
import { LocalBenefits } from "@/components/landing/LocalBenefits";
import { FounderCTA } from "@/components/landing/FounderCTA";
import { UtilityStrip } from "@/components/landing/UtilityStrip";
import { PremiumSponsorsCarousel } from "@/components/landing/PremiumSponsorsCarousel";
import { CinematicFooter } from "@/components/landing/CinematicFooter";
import { SearchProvider } from "@/components/landing/SearchContext";
import { getActiveTowers } from "@/lib/services/towers";
import { getActivePartners } from "@/lib/services/institutional-partners";
import { getRecentNews } from "@/lib/services/news";
import { getUpcomingEvents } from "@/lib/services/events";
import type { Business } from "@/data/businesses";
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

// Planos pagos aparecem primeiro em "Negócios em destaque".
const PLAN_PRIORITY: Record<Business["plan"], number> = { experiencia: 3, destaque: 2, profissional: 1, presenca: 0 };

export default async function Preview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [allBusinesses, featuredBusinessesRaw, opportunities, benefits, proofStats, towers, partners, news, events] =
    await Promise.all([
      getAllBusinesses(locale),
      getFeaturedBusinesses(undefined, locale),
      getOpportunities(locale),
      getBenefits(locale),
      getHomeProofStats(),
      getActiveTowers(),
      getActivePartners(),
      getRecentNews(3),
      getUpcomingEvents(),
    ]);
  const featuredBusinesses = featuredBusinessesRaw
    .filter((b) => !TEST_RECORD_RE.test(b.name))
    .sort((a, b) => PLAN_PRIORITY[b.effectivePlan] - PLAN_PRIORITY[a.effectivePlan])
    .slice(0, 6);
  const directoryBusinesses = allBusinesses.filter((b) => !TEST_RECORD_RE.test(b.name));

  return (
    <>
      <Header />
      <main className="flex-1">
        <SearchProvider>
          {/* 1. Hero -- estático, painel lateral à direita (desktop) */}
          <NetworkNarrative towers={towers} />

          {/* 2. Categorias -- direto abaixo do hero */}
          <FourUniverses />

          {/* 3. Negócios em destaque (planos pagos primeiro) + diretório completo (destino da busca do hero) */}
          <FeaturedBusinesses businesses={featuredBusinesses} />
          <Suspense fallback={null}>
            <Directory businesses={directoryBusinesses} />
          </Suspense>

          {/* 4. Parceiros fundadores -- empresas que impulsionam o Hub */}
          <PremiumSponsorsCarousel partners={partners} />

          {/* 5. Faixa de logos (máx. 10) */}
          <InstitutionalPartners />

          {/* 6. Eventos / Âncoras institucionais / O Complexo */}
          <DestaqueBlocks />

          {/* 7. São Caetano do Sul (1/3) + Acontece no Cerâmica (2/3) */}
          <CityAndNews news={news} events={events} locale={locale} />

          {/* 8. Rede, benefícios e prova de relevância (seções existentes, mantidas) */}
          <OpportunityNetwork opportunities={opportunities} />
          <LocalBenefits benefits={benefits} />
          <ProofOfRelevance stats={proofStats} />

          {/* 9. Texto institucional */}
          <InstitutionalStatement />

          {/* 10. Mapa / como chegar / fale conosco */}
          <UtilityStrip towers={towers} />

          {/* 11. Faça parte do Cerâmica Hub */}
          <FounderCTA />
        </SearchProvider>
      </main>
      <CinematicFooter />
    </>
  );
}
