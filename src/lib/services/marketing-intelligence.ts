import { createServiceClient } from "@/lib/supabase/server";
import { categories } from "@/data/businesses";
import { slugFromCategory } from "@/lib/category-slug";
import { getPlacementsInventory, type PlacementInventory } from "@/lib/services/ads";
import { getPortalAnalytics, type PortalAnalytics, type RankedItem } from "@/lib/services/portal-analytics";
import { getAdOccupancy, getCampaignsPerformance, type CampaignPerformance } from "@/lib/services/results";
import { getScoredCustomers, type ScoredCustomer } from "@/lib/services/scoring-data";

/** Inteligência de marketing (Fase 4.6): recomendações calculadas dos dados reais. Sem dado suficiente, diz isso em vez de inventar. */

const WINDOW_DAYS = 30;
const MIN_CAMPAIGN_IMPRESSIONS = 100;
const MIN_RHYTHM_VISITS = 30;
const WEEKDAYS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const UPGRADE_FROM = ["presenca", "profissional"];
const ANCHOR_PLANS = ["destaque", "experiencia", "premium"];
const ANCHOR_MIN_AGE_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;
const CONTENT_EXCLUDED_PREFIXES = ["/empresa/", "/categoria/", "/busca"];

export type Recommendation = { title: string; detail: string; href?: string };

export type IntelligenceSection = {
  key: string;
  title: string;
  description: string;
  items: Recommendation[];
  /** Mostrado quando não há item: explica se faltam dados ou se simplesmente não há nada a recomendar. */
  emptyMessage: string;
};

const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const businessHref = (customer: ScoredCustomer) => `/admin/empresas/${customer.businessId}`;

export function needsPromotion(customers: ScoredCustomer[]): Recommendation[] {
  if (customers.length < 3) return [];
  const mid = median(customers.map((c) => c.engagement.views));
  return customers
    .filter((c) => c.engagement.views < mid && c.engagement.clicks === 0)
    .sort((a, b) => a.engagement.views - b.engagement.views)
    .slice(0, 5)
    .map((c) => ({
      title: c.name,
      detail: `${c.engagement.views} visita(s) e nenhum contato em ${WINDOW_DAYS} dias (mediana das empresas: ${Math.round(mid)}).`,
      href: businessHref(c),
    }));
}

export function thinCategories(customers: ScoredCustomer[], analytics: PortalAnalytics): Recommendation[] {
  const supply = new Map<string, number>();
  for (const customer of customers) {
    const slug = slugFromCategory(customer.category);
    supply.set(slug, (supply.get(slug) ?? 0) + 1);
  }
  const nameBySlug = new Map(categories.filter((c) => c !== "Todas").map((c) => [slugFromCategory(c), c]));
  return analytics.topCategories
    .map((demand) => ({ demand, companies: supply.get(demand.label) ?? 0 }))
    .filter(({ demand }) => nameBySlug.has(demand.label))
    .sort((a, b) => b.demand.total / (b.companies + 1) - a.demand.total / (a.companies + 1))
    .slice(0, 5)
    .map(({ demand, companies }) => ({
      title: nameBySlug.get(demand.label) ?? demand.label,
      detail: `${demand.total} visita(s) à categoria para ${companies} empresa(s) cadastrada(s).`,
    }));
}

export function bestCampaigns(campaigns: CampaignPerformance[]): Recommendation[] {
  return campaigns
    .filter((c) => c.impressions >= MIN_CAMPAIGN_IMPRESSIONS)
    .sort((a, b) => b.ctr - a.ctr)
    .slice(0, 3)
    .map((c) => ({
      title: `${c.title} · ${c.advertiserName}`,
      detail: `CTR de ${c.ctr.toFixed(2)}% com ${c.impressions} impressões e ${c.clicks} clique(s), em ${c.placementName}.`,
      href: "/admin/publicidade",
    }));
}

export function vacantSpaces(inventory: PlacementInventory[]): Recommendation[] {
  return inventory
    .filter((placement) => placement.status === "vago")
    .map((placement) => ({ title: placement.name, detail: "Espaço vago agora, pronto para venda.", href: "/admin/publicidade/espacos" }));
}

export function upgradeCandidates(customers: ScoredCustomer[]): Recommendation[] {
  const mid = median(customers.map((c) => c.engagement.views));
  return customers
    .filter((c) => UPGRADE_FROM.includes(c.plan) && c.engagement.views > 0 && c.engagement.views >= mid && c.health.band === "saudavel")
    .sort((a, b) => b.engagement.views - a.engagement.views)
    .slice(0, 5)
    .map((c) => ({
      title: c.name,
      detail: `Plano ${c.plan} com ${c.engagement.views} visita(s) e ${c.engagement.clicks} contato(s): demanda para um plano com mais recursos.`,
      href: businessHref(c),
    }));
}

export function anchorCandidates(customers: ScoredCustomer[], now = new Date()): Recommendation[] {
  const top = customers.map((c) => c.engagement.views).sort((a, b) => b - a);
  const threshold = top[Math.floor(top.length / 4)] ?? 0;
  return customers
    .filter((c) => ANCHOR_PLANS.includes(c.plan) && c.health.band === "saudavel" && c.engagement.views > 0 && c.engagement.views >= threshold)
    .filter((c) => (now.getTime() - new Date(c.createdAt).getTime()) / DAY_MS >= ANCHOR_MIN_AGE_DAYS)
    .slice(0, 5)
    .map((c) => ({
      title: c.name,
      detail: `Plano ${c.plan}, saudável, no quartil de maior audiência (${c.engagement.views} visitas) e com mais de ${ANCHOR_MIN_AGE_DAYS} dias de casa.`,
      href: businessHref(c),
    }));
}

export function topContent(pages: RankedItem[]): Recommendation[] {
  return pages
    .filter((page) => page.label !== "/" && !CONTENT_EXCLUDED_PREFIXES.some((prefix) => page.label.startsWith(prefix)))
    .slice(0, 5)
    .map((page) => ({ title: page.label, detail: `${page.total} visita(s) em ${WINDOW_DAYS} dias.` }));
}

type RhythmRow = { k: number; total: number };

function topSlots(rows: RhythmRow[], label: (k: number) => string): string {
  return [...rows]
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)
    .map((row) => `${label(row.k)} (${row.total})`)
    .join(", ");
}

export function bestPeriods(rhythm: { by_weekday: RhythmRow[]; by_hour: RhythmRow[] }, visits: number): Recommendation[] {
  if (visits < MIN_RHYTHM_VISITS) return [];
  return [
    { title: "Melhores dias da semana", detail: topSlots(rhythm.by_weekday, (k) => WEEKDAYS[k]) },
    { title: "Melhores horários", detail: topSlots(rhythm.by_hour, (k) => `${k}h`) },
  ];
}

async function getRhythm(): Promise<{ by_weekday: RhythmRow[]; by_hour: RhythmRow[] }> {
  const { data, error } = await createServiceClient().rpc("portal_visit_rhythm", { p_days: WINDOW_DAYS });
  if (error) throw error;
  return data as { by_weekday: RhythmRow[]; by_hour: RhythmRow[] };
}

export async function getMarketingIntelligence(): Promise<IntelligenceSection[]> {
  const [customers, analytics, campaigns, inventory, occupancy, rhythm] = await Promise.all([
    getScoredCustomers(),
    getPortalAnalytics(WINDOW_DAYS),
    getCampaignsPerformance(),
    getPlacementsInventory(),
    getAdOccupancy(),
    getRhythm(),
  ]);
  const vacant = vacantSpaces(inventory);

  return [
    { key: "promotion", title: "Empresas que precisam de mais divulgação", description: "Menos visitas que a mediana e nenhum contato gerado.", items: needsPromotion(customers), emptyMessage: "Nenhuma empresa abaixo da mediana, ou ainda há menos de 3 empresas para comparar." },
    { key: "categories", title: "Categorias com pouca oferta", description: "Muita procura por empresa cadastrada.", items: thinCategories(customers, analytics), emptyMessage: "Ainda sem visitas a categorias no período." },
    { key: "campaigns", title: "Campanhas com melhor resultado", description: `Maior CTR entre campanhas com pelo menos ${MIN_CAMPAIGN_IMPRESSIONS} impressões.`, items: bestCampaigns(campaigns), emptyMessage: "Nenhuma campanha com impressões suficientes para comparar." },
    { key: "spaces", title: `Espaços publicitários disponíveis (${occupancy.vacant} de ${occupancy.total})`, description: "Inventário vago agora.", items: vacant, emptyMessage: "Todos os espaços estão ocupados ou reservados." },
    { key: "upgrade", title: "Empresas com potencial de upgrade", description: "Planos de entrada com audiência acima da mediana e conta saudável.", items: upgradeCandidates(customers), emptyMessage: "Nenhuma empresa de plano de entrada com audiência acima da mediana." },
    { key: "anchors", title: "Clientes que podem se tornar Âncoras", description: "Plano alto, saudáveis, maior audiência e mais de 90 dias na plataforma.", items: anchorCandidates(customers), emptyMessage: "Nenhum cliente cumpre todos os critérios hoje." },
    { key: "content", title: "Conteúdos com maior engajamento", description: "Páginas de conteúdo mais visitadas (exclui home, empresas e categorias).", items: topContent(analytics.topPages), emptyMessage: "Ainda sem visitas a conteúdos no período." },
    { key: "periods", title: "Melhores períodos para campanhas", description: `Dias e horários com mais visitas (Brasília), a partir de ${MIN_RHYTHM_VISITS} visitas.`, items: bestPeriods(rhythm, analytics.visits), emptyMessage: `Dados insuficientes: ${analytics.visits} visita(s) registrada(s) nos últimos ${WINDOW_DAYS} dias.` },
  ];
}
