import { getAllBusinesses } from "@/lib/services/platform";
import { getOpportunities, getBenefits } from "@/lib/services/platform";
import { getActiveHotels } from "@/lib/services/hotels";
import { getActiveMeetingSpaces } from "@/lib/services/meeting-spaces";
import { getActiveListings } from "@/lib/services/real-estate";
import { categories } from "@/data/businesses";

export type SearchResult = {
  type: "empresa" | "categoria" | "hotel" | "espaco" | "imovel" | "oportunidade" | "promocao";
  title: string;
  subtitle: string;
  href: string;
  sponsored: boolean;
};

const PLAN_RANK: Record<string, number> = { experiencia: 3, destaque: 2, profissional: 1, presenca: 0 };

function relevanceTier(term: string, text: string): number | null {
  const normalizedTerm = term.trim().toLowerCase();
  const normalizedText = text.trim().toLowerCase();
  if (!normalizedTerm) return null;
  if (normalizedText === normalizedTerm) return 0;
  if (normalizedText.startsWith(normalizedTerm)) return 1;
  if (normalizedText.includes(normalizedTerm)) return 2;
  return null;
}

/**
 * Busca em tudo que já existe (empresas, categorias, hotéis, espaços de
 * evento, imóveis, oportunidades, promoções). Ordena por relevância de
 * texto primeiro (correspondência exata > começa com > contém) -- plano
 * pago só desempata dentro do MESMO nível de relevância, nunca fura na
 * frente de um resultado mais relevante (regra explícita do documento:
 * "não fazer resultado irrelevante aparecer em primeiro só porque pagou").
 */
export async function searchGlobal(term: string, locale?: string): Promise<SearchResult[]> {
  const normalized = term.trim();
  if (!normalized) return [];

  const [businesses, opportunities, benefits, hotels, spaces, listings] = await Promise.all([
    getAllBusinesses(locale),
    getOpportunities(locale),
    getBenefits(locale),
    getActiveHotels(),
    getActiveMeetingSpaces(),
    getActiveListings(),
  ]);

  type Scored = SearchResult & { tier: number; planRank: number };
  const scored: Scored[] = [];

  for (const business of businesses) {
    const tier = relevanceTier(normalized, `${business.name} ${business.category} ${business.description}`);
    if (tier === null) continue;
    scored.push({
      type: "empresa",
      title: business.name,
      subtitle: business.category,
      href: `/empresa/${business.slug}`,
      sponsored: business.effectivePlan !== "presenca",
      tier,
      planRank: PLAN_RANK[business.effectivePlan] ?? 0,
    });
  }

  for (const category of categories) {
    if (category === "Todas") continue;
    const tier = relevanceTier(normalized, category);
    if (tier === null) continue;
    scored.push({
      type: "categoria",
      title: category,
      subtitle: "Categoria",
      href: `/preview?categoria=${encodeURIComponent(category)}#empresas`,
      sponsored: false,
      tier,
      planRank: 0,
    });
  }

  for (const hotel of hotels) {
    const tier = relevanceTier(normalized, `${hotel.name} ${hotel.address ?? ""}`);
    if (tier === null) continue;
    scored.push({ type: "hotel", title: hotel.name, subtitle: "Hotel", href: "/business-travel", sponsored: false, tier, planRank: 0 });
  }

  for (const space of spaces) {
    const tier = relevanceTier(normalized, `${space.name} ${space.description ?? ""}`);
    if (tier === null) continue;
    scored.push({
      type: "espaco",
      title: space.name,
      subtitle: space.spaceType === "auditorio" ? "Auditório" : "Sala de reunião",
      href: "/auditorios-reunioes",
      sponsored: false,
      tier,
      planRank: 0,
    });
  }

  for (const listing of listings) {
    const tier = relevanceTier(normalized, `${listing.title} ${listing.description ?? ""}`);
    if (tier === null) continue;
    scored.push({
      type: "imovel",
      title: listing.title,
      subtitle: listing.listingType === "venda" ? "Imóvel à venda" : "Imóvel para locação",
      href: "/imobiliarias",
      sponsored: false,
      tier,
      planRank: 0,
    });
  }

  for (const opportunity of opportunities) {
    const tier = relevanceTier(normalized, `${opportunity.title} ${opportunity.description ?? ""}`);
    if (tier === null) continue;
    scored.push({
      type: "oportunidade",
      title: opportunity.title,
      subtitle: `Oportunidade · ${opportunity.business.name}`,
      href: `/empresa/${opportunity.business.slug}`,
      sponsored: false,
      tier,
      planRank: 0,
    });
  }

  for (const benefit of benefits) {
    const tier = relevanceTier(normalized, `${benefit.title} ${benefit.description ?? ""}`);
    if (tier === null) continue;
    scored.push({
      type: "promocao",
      title: benefit.title,
      subtitle: `Promoção · ${benefit.business.name}`,
      href: `/empresa/${benefit.business.slug}`,
      sponsored: false,
      tier,
      planRank: 0,
    });
  }

  return scored
    .sort((a, b) => a.tier - b.tier || b.planRank - a.planRank || a.title.localeCompare(b.title))
    .slice(0, 20)
    .map(({ tier: _tier, planRank: _planRank, ...result }) => result);
}
