import { businesses, categories, type Business } from "@/data/businesses";
import { opportunities, type Opportunity } from "@/data/opportunities";
import { benefits, type Benefit } from "@/data/benefits";

export type PlatformStats = {
  businesses: number;
  categories: number;
  floors: number;
};

export type CategoryBreakdown = {
  category: string;
  count: number;
};

/**
 * Camada de serviço da plataforma. Hoje lê os dados de demonstração em
 * `src/data/businesses.ts`; a assinatura async já deixa pronta a troca por
 * consultas reais ao Supabase sem alterar quem chama essas funções.
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  const floors = new Set(businesses.map((business) => business.floor));
  const realCategories = categories.filter((category) => category !== "Todas");

  return {
    businesses: businesses.length,
    categories: realCategories.length,
    floors: floors.size,
  };
}

export async function getCategoryBreakdown(): Promise<CategoryBreakdown[]> {
  const realCategories = categories.filter((category) => category !== "Todas");

  return realCategories.map((category) => ({
    category,
    count: businesses.filter((business) => business.category === category).length,
  }));
}

export async function getFeaturedBusinesses(limit?: number): Promise<Business[]> {
  const featured = businesses.filter((business) => business.featured);
  return typeof limit === "number" ? featured.slice(0, limit) : featured;
}

export async function getAllBusinesses(): Promise<Business[]> {
  return businesses;
}

export type OpportunityWithBusiness = Opportunity & { business: Business };

export async function getOpportunities(): Promise<OpportunityWithBusiness[]> {
  return opportunities.flatMap((opportunity) => {
    const business = businesses.find((b) => b.id === opportunity.businessId);
    return business ? [{ ...opportunity, business }] : [];
  });
}

export type BenefitWithBusiness = Benefit & { business: Business };

export async function getBenefits(): Promise<BenefitWithBusiness[]> {
  return benefits.flatMap((benefit) => {
    const business = businesses.find((b) => b.id === benefit.businessId);
    return business ? [{ ...benefit, business }] : [];
  });
}
