import { createServiceClient } from "@/lib/supabase/server";

/** Portal de resultados da empresa (Fase 3.5). Lê metrics_events direto
 * (tempo real, inclui o dia de hoje que analytics_daily ainda não agregou) --
 * o volume por empresa é pequeno. Nunca inventa número: sem evento, 0. */

export const RESULT_PERIODS = [7, 30, 90] as const;
export type ResultPeriod = (typeof RESULT_PERIODS)[number];

export function parsePeriod(raw: string | undefined): ResultPeriod {
  const value = Number(raw);
  return (RESULT_PERIODS as readonly number[]).includes(value) ? (value as ResultPeriod) : 30;
}

export type ResultTotals = {
  views: number;
  whatsapp: number;
  phone: number;
  website: number;
  directions: number;
  appointments: number;
  /** Contatos gerados: toda ação em que o visitante procurou a empresa (exceto ver rota/site). */
  leads: number;
};

export type DailyResult = { day: string; views: number; leads: number };

export type BusinessResults = {
  totals: ResultTotals;
  previous: ResultTotals;
  daily: DailyResult[];
};

const TRACKED = [
  "commercial_page_viewed",
  "whatsapp_clicked",
  "phone_clicked",
  "website_clicked",
  "directions_clicked",
  "appointment_clicked",
] as const;

const LEAD_EVENTS = new Set<string>(["whatsapp_clicked", "phone_clicked", "appointment_clicked"]);

const emptyTotals = (): ResultTotals => ({
  views: 0,
  whatsapp: 0,
  phone: 0,
  website: 0,
  directions: 0,
  appointments: 0,
  leads: 0,
});

function addToTotals(totals: ResultTotals, eventType: string) {
  switch (eventType) {
    case "commercial_page_viewed":
      totals.views += 1;
      break;
    case "whatsapp_clicked":
      totals.whatsapp += 1;
      break;
    case "phone_clicked":
      totals.phone += 1;
      break;
    case "website_clicked":
      totals.website += 1;
      break;
    case "directions_clicked":
      totals.directions += 1;
      break;
    case "appointment_clicked":
      totals.appointments += 1;
      break;
  }
  if (LEAD_EVENTS.has(eventType)) totals.leads += 1;
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const PAGE_SIZE = 1000;

/** O PostgREST corta em 1000 linhas por consulta; pagina até esgotar pra 90 dias de empresa movimentada não sumir. */
async function fetchEventRows(businessId: string, from: Date, to: Date): Promise<{ event_type: string; created_at: string }[]> {
  const supabase = createServiceClient();
  const rows: { event_type: string; created_at: string }[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("metrics_events")
      .select("event_type, created_at")
      .eq("business_id", businessId)
      .in("event_type", TRACKED as unknown as string[])
      .gte("created_at", from.toISOString())
      .lt("created_at", to.toISOString())
      .order("created_at", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < PAGE_SIZE) return rows;
  }
}

/** Resultados de [from, to) da empresa, somados e por dia (dia sem evento = 0). */
export async function getResultsBetween(businessId: string, from: Date, to: Date): Promise<{ totals: ResultTotals; daily: DailyResult[] }> {
  const rows = await fetchEventRows(businessId, from, to);

  const totals = emptyTotals();
  const byDay = new Map<string, DailyResult>();
  for (const cursor = new Date(from); cursor < to; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    byDay.set(dayKey(cursor), { day: dayKey(cursor), views: 0, leads: 0 });
  }
  for (const row of rows) {
    addToTotals(totals, row.event_type);
    const entry = byDay.get(row.created_at.slice(0, 10));
    if (!entry) continue;
    if (row.event_type === "commercial_page_viewed") entry.views += 1;
    if (LEAD_EVENTS.has(row.event_type)) entry.leads += 1;
  }
  return { totals, daily: Array.from(byDay.values()) };
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Últimos `days` dias (incluindo hoje) + o período imediatamente anterior, pra comparação. */
export async function getBusinessResults(businessId: string, days: ResultPeriod): Promise<BusinessResults> {
  const today = startOfUtcDay(new Date());
  const to = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  const previousFrom = new Date(from.getTime() - days * 24 * 60 * 60 * 1000);

  const [current, previous] = await Promise.all([
    getResultsBetween(businessId, from, to),
    getResultsBetween(businessId, previousFrom, from),
  ]);
  return { totals: current.totals, daily: current.daily, previous: previous.totals };
}

export type MonthlyReport = {
  month: string; // YYYY-MM
  results: { totals: ResultTotals; daily: DailyResult[] };
  previousTotals: ResultTotals;
};

export function isValidMonth(value: string | undefined): value is string {
  return !!value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

/** Mês anterior ao de `now`, no formato YYYY-MM. */
export function previousMonthKey(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return d.toISOString().slice(0, 7);
}

export function monthRange(month: string): { from: Date; to: Date } {
  const [year, m] = month.split("-").map(Number);
  return { from: new Date(Date.UTC(year, m - 1, 1)), to: new Date(Date.UTC(year, m, 1)) };
}

export async function getMonthlyReport(businessId: string, month: string): Promise<MonthlyReport> {
  const current = monthRange(month);
  const [year, m] = month.split("-").map(Number);
  const previous = monthRange(new Date(Date.UTC(year, m - 2, 1)).toISOString().slice(0, 7));
  const [results, previousResults] = await Promise.all([
    getResultsBetween(businessId, current.from, current.to),
    getResultsBetween(businessId, previous.from, previous.to),
  ]);
  return { month, results, previousTotals: previousResults.totals };
}

export function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m - 1, 1)).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
}

/** Variação percentual vs. período anterior; null quando não há base de comparação. */
export function deltaPercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
