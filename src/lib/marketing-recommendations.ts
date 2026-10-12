/** Recomendações automáticas do painel (puras): regras simples sobre dados reais, nunca números inventados. */
export type RecommendationFacts = {
  plan: string;
  photoCount: number;
  hasActivePromotion: boolean;
  /** dias até a promoção ativa mais próxima terminar */
  promotionEndsInDays: number | null;
  /** dias até uma campanha da loja terminar */
  campaignEndsInDays: number | null;
  /** próximo espaço livre interessante */
  openSpace: { name: string; from: string } | null;
  /** dia da semana (0-6) e faixa de horas com mais acessos, se houver dado suficiente */
  peak: { weekday: number; fromHour: number; toHour: number } | null;
  unansweredLeads: number;
  hasNoCampaignScheduled: boolean;
};

export type Recommendation = { id: string; text: string; href: string; cta: string; priority: number };

const WEEKDAYS = ["domingos", "segundas-feiras", "terças-feiras", "quartas-feiras", "quintas-feiras", "sextas-feiras", "sábados"];
const MIN_PHOTOS = 6;
const SOON_DAYS = 3;

export function buildRecommendations(f: RecommendationFacts): Recommendation[] {
  const list: Recommendation[] = [];
  if (f.unansweredLeads > 0) {
    list.push({ id: "leads", priority: 100, text: `Você tem ${f.unansweredLeads} contato(s) novo(s) sem resposta. Responder rápido aumenta a chance de fechar.`, href: "/dashboard/leads", cta: "Ver contatos" });
  }
  if (f.promotionEndsInDays !== null && f.promotionEndsInDays >= 0 && f.promotionEndsInDays <= SOON_DAYS) {
    list.push({ id: "promo-ending", priority: 90, text: `Sua promoção termina em ${f.promotionEndsInDays} dia(s). Deseja renovar?`, href: "/dashboard/editar?tab=promocoes", cta: "Renovar promoção" });
  }
  if (f.campaignEndsInDays !== null && f.campaignEndsInDays >= 0 && f.campaignEndsInDays <= SOON_DAYS) {
    list.push({ id: "campaign-ending", priority: 85, text: `Seu anúncio termina em ${f.campaignEndsInDays} dia(s). Reserve a continuação para não ficar fora do ar.`, href: "/dashboard/anuncios", cta: "Renovar anúncio" });
  }
  if (!f.hasActivePromotion) {
    list.push({ id: "no-promo", priority: 70, text: "Você ainda não tem uma promoção ativa. Promoções aumentam cliques e visitas à sua página.", href: "/dashboard/editar?tab=promocoes", cta: "Criar promoção" });
  }
  if (f.photoCount < MIN_PHOTOS) {
    list.push({ id: "photos", priority: 60, text: `Empresas com pelo menos ${MIN_PHOTOS} fotos recebem mais interações. Você tem ${f.photoCount}.`, href: "/dashboard/midias", cta: "Adicionar fotos" });
  }
  if (f.openSpace) {
    list.push({ id: "space", priority: 50, text: `Existe um espaço disponível: ${f.openSpace.name}, a partir de ${f.openSpace.from.split("-").reverse().join("/")}.`, href: "/dashboard/anuncios", cta: "Ver espaço" });
  }
  if (f.peak) {
    list.push({ id: "peak", priority: 40, text: `Sua página recebe mais acessos às ${WEEKDAYS[f.peak.weekday]} entre ${f.peak.fromHour}h e ${f.peak.toHour}h. Programe suas publicações para esse horário.`, href: "/dashboard/anuncios", cta: "Programar divulgação" });
  }
  if (f.hasNoCampaignScheduled && f.plan !== "presenca") {
    list.push({ id: "no-schedule", priority: 30, text: "Nenhuma divulgação programada para os próximos dias. Que tal agendar um Story ou um destaque?", href: "/dashboard/anuncios", cta: "Agendar" });
  }
  return list.sort((a, b) => b.priority - a.priority);
}

/** Variação percentual entre períodos; null quando não há base de comparação. */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function describeChange(label: string, change: number | null): string | null {
  if (change === null) return null;
  if (change === 0) return `${label} ficaram iguais ao período anterior.`;
  return change > 0 ? `Você recebeu ${change}% mais ${label} que no período anterior.` : `${label[0].toUpperCase()}${label.slice(1)} caíram ${Math.abs(change)}% em relação ao período anterior.`;
}
