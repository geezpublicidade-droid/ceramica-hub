import { conversionRate } from "./sections.ts";

export type MetricRow = { event_type: string; metadata: Record<string, unknown> | null; created_at: string };

export type LandingMetrics = {
  /** visitas à página (uma por sessão) */
  views: number;
  whatsapp: number;
  phone: number;
  directions: number;
  leads: number;
  offerClicks: number;
  /** cupons rastreáveis efetivamente usados (validados pela empresa) */
  couponsUsed: number;
  serviceClicks: number;
  /** whatsapp + telefone + como chegar + formulário */
  contactActions: number;
  /** ações de contato ÷ visitas × 100 */
  conversionRate: number;
  /** serviço mais clicado primeiro (id do item → total) */
  topServiceIds: { id: string; count: number }[];
  sources: { source: string; count: number }[];
  devices: { device: string; count: number }[];
  campaigns: { campaign: string; count: number }[];
  /** slug da categoria de onde a visita veio */
  fromCategories: { category: string; count: number }[];
  /** visitas por dia (YYYY-MM-DD, fuso de São Paulo), só dias com visita */
  viewsByDay: { day: string; count: number }[];
};

function bump(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function ranked(map: Map<string, number>, limit: number): [string, number][] {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

const saoPauloDay = (iso: string) => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date(iso));

/** Conta os eventos de uma empresa num período e calcula a taxa de conversão. */
export function summarizeEvents(rows: MetricRow[]): LandingMetrics {
  const counts: Record<string, number> = {};
  const services = new Map<string, number>();
  const sources = new Map<string, number>();
  const devices = new Map<string, number>();
  const campaigns = new Map<string, number>();
  const categories = new Map<string, number>();
  const days = new Map<string, number>();

  for (const row of rows) {
    counts[row.event_type] = (counts[row.event_type] ?? 0) + 1;
    const meta = row.metadata ?? {};
    if (row.event_type === "service_clicked" && typeof meta.itemId === "string") bump(services, meta.itemId);
    if (row.event_type === "commercial_page_viewed") {
      bump(sources, typeof meta.source === "string" && meta.source ? meta.source : "direto");
      bump(days, saoPauloDay(row.created_at));
      if (typeof meta.device === "string") bump(devices, meta.device);
      if (typeof meta.campaign === "string" && meta.campaign) bump(campaigns, meta.campaign);
      if (typeof meta.fromCategory === "string" && meta.fromCategory) bump(categories, meta.fromCategory);
    }
  }

  const views = counts.commercial_page_viewed ?? 0;
  const whatsapp = counts.whatsapp_clicked ?? 0;
  const phone = counts.phone_clicked ?? 0;
  const directions = counts.directions_clicked ?? 0;
  const leads = counts.lead_submitted ?? 0;
  const contactActions = whatsapp + phone + directions + leads;

  return {
    views,
    whatsapp,
    phone,
    directions,
    leads,
    offerClicks: counts.offer_clicked ?? 0,
    couponsUsed: counts.coupon_redeemed ?? 0,
    serviceClicks: counts.service_clicked ?? 0,
    contactActions,
    conversionRate: conversionRate(contactActions, views),
    topServiceIds: ranked(services, 5).map(([id, count]) => ({ id, count })),
    sources: ranked(sources, 6).map(([source, count]) => ({ source, count })),
    devices: ranked(devices, 3).map(([device, count]) => ({ device, count })),
    campaigns: ranked(campaigns, 5).map(([campaign, count]) => ({ campaign, count })),
    fromCategories: ranked(categories, 5).map(([category, count]) => ({ category, count })),
    viewsByDay: [...days.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([day, count]) => ({ day, count })),
  };
}

export type RangePreset = "today" | "7d" | "30d" | "90d" | "custom";
export type DateRange = { from: string; to: string };

const DAY_MS = 24 * 60 * 60 * 1000;
/** Brasília não tem horário de verão desde 2019: UTC-3 fixo. */
const SP_OFFSET = "-03:00";

/** Início do dia (00:00 em São Paulo) de uma data YYYY-MM-DD, em ISO UTC. */
function startOfDay(day: string): string {
  return new Date(`${day}T00:00:00${SP_OFFSET}`).toISOString();
}

/**
 * Período do filtro como intervalo [from, to) em ISO UTC. "Hoje" começa à meia-noite de São Paulo;
 * 7/30/90 dias incluem hoje. Personalizado: datas YYYY-MM-DD inclusivas (inválido ou invertido = null).
 */
export function resolveRange(preset: RangePreset, custom?: { from?: string; to?: string }, now: Date = new Date()): DateRange | null {
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(now);
  const startToday = new Date(startOfDay(today)).getTime();
  const end = new Date(startToday + DAY_MS).toISOString();

  if (preset === "today") return { from: new Date(startToday).toISOString(), to: end };
  if (preset === "custom") {
    const re = /^\d{4}-\d{2}-\d{2}$/;
    if (!custom?.from || !custom?.to || !re.test(custom.from) || !re.test(custom.to)) return null;
    const from = startOfDay(custom.from);
    const to = new Date(new Date(startOfDay(custom.to)).getTime() + DAY_MS).toISOString();
    return from < to && new Date(to).getTime() - new Date(from).getTime() <= 366 * DAY_MS ? { from, to } : null;
  }
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  return { from: new Date(startToday - (days - 1) * DAY_MS).toISOString(), to: end };
}
