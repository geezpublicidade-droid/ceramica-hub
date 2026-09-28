import { createServiceClient } from "@/lib/supabase/server";
import { getAllCampaigns, getPlacementsInventory } from "@/lib/services/ads";

/** Seção "Resultados" do admin (analytics agregado) -- reaproveita tabelas
 * que já existiam (analytics_daily, metrics_events, ad_campaigns,
 * ad_placements), nunca inventa número: empresa/categoria/torre sem evento
 * registrado no período aparece com 0, não some da lista. */

const TRACKED_EVENT_TYPES = [
  "commercial_page_viewed",
  "whatsapp_clicked",
  "directions_clicked",
  "appointment_clicked",
] as const;
type TrackedEventType = (typeof TRACKED_EVENT_TYPES)[number];

export type EventBreakdown = {
  pageViews: number;
  whatsappClicks: number;
  directionsClicks: number;
  appointmentClicks: number;
};

const EMPTY_BREAKDOWN: EventBreakdown = { pageViews: 0, whatsappClicks: 0, directionsClicks: 0, appointmentClicks: 0 };

function addEvent(entry: EventBreakdown, eventType: TrackedEventType, count: number): EventBreakdown {
  switch (eventType) {
    case "commercial_page_viewed":
      return { ...entry, pageViews: entry.pageViews + count };
    case "whatsapp_clicked":
      return { ...entry, whatsappClicks: entry.whatsappClicks + count };
    case "directions_clicked":
      return { ...entry, directionsClicks: entry.directionsClicks + count };
    case "appointment_clicked":
      return { ...entry, appointmentClicks: entry.appointmentClicks + count };
  }
}

export type BusinessPerformance = EventBreakdown & {
  businessId: string;
  businessName: string;
  category: string;
  towerName: string | null;
};

/** Desempenho por empresa aprovada nos últimos `days` dias, a partir de
 * analytics_daily (agregado diário já populado pelo cron -- ver
 * aggregate-analytics). Empresa aprovada sem evento no período entra com
 * tudo zerado, não é omitida. */
export async function getBusinessPerformance(days: number): Promise<BusinessPerformance[]> {
  const supabase = createServiceClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [{ data: daily, error: dailyError }, { data: businesses, error: bizError }] = await Promise.all([
    supabase
      .from("analytics_daily")
      .select("business_id, event_type, count")
      .in("event_type", TRACKED_EVENT_TYPES as unknown as string[])
      .gte("day", since),
    supabase.from("businesses").select("id, name, category, towers(name)").eq("status", "approved").order("name"),
  ]);
  if (dailyError) throw dailyError;
  if (bizError) throw bizError;

  const byBusiness = new Map<string, EventBreakdown>();
  for (const row of daily ?? []) {
    const current = byBusiness.get(row.business_id) ?? EMPTY_BREAKDOWN;
    byBusiness.set(row.business_id, addEvent(current, row.event_type as TrackedEventType, row.count));
  }

  return (businesses ?? []).map((row) => ({
    businessId: row.id,
    businessName: row.name,
    category: row.category,
    towerName: (row.towers as unknown as { name: string } | null)?.name ?? null,
    ...(byBusiness.get(row.id) ?? EMPTY_BREAKDOWN),
  }));
}

export type GroupPerformance = EventBreakdown & { label: string; businessCount: number };

function groupBy(items: BusinessPerformance[], keyFn: (item: BusinessPerformance) => string | null): GroupPerformance[] {
  const map = new Map<string, GroupPerformance>();
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    const current = map.get(key) ?? { label: key, businessCount: 0, ...EMPTY_BREAKDOWN };
    map.set(key, {
      label: key,
      businessCount: current.businessCount + 1,
      pageViews: current.pageViews + item.pageViews,
      whatsappClicks: current.whatsappClicks + item.whatsappClicks,
      directionsClicks: current.directionsClicks + item.directionsClicks,
      appointmentClicks: current.appointmentClicks + item.appointmentClicks,
    });
  }
  return Array.from(map.values()).sort((a, b) => b.pageViews - a.pageViews);
}

/** Agrupamento em memória a partir do mesmo array de `getBusinessPerformance`
 * -- evita uma segunda consulta só pra somar por categoria/torre. */
export function groupPerformanceByCategory(items: BusinessPerformance[]): GroupPerformance[] {
  return groupBy(items, (item) => item.category);
}

export function groupPerformanceByTower(items: BusinessPerformance[]): GroupPerformance[] {
  return groupBy(items, (item) => item.towerName);
}

export type CampaignPerformance = {
  campaignId: string;
  title: string;
  advertiserName: string;
  placementName: string;
  status: string;
  impressions: number;
  clicks: number;
  ctr: number;
};

/** Desempenho de todas as campanhas de publicidade (impressões/cliques/CTR),
 * reaproveitando getAllCampaigns (ads.ts) e lendo metrics_events uma única
 * vez em vez de uma consulta por campanha (evita N+1 -- getCampaignMetrics
 * já existe pra uma campanha isolada, aqui é o mesmo cálculo em lote). */
export async function getCampaignsPerformance(): Promise<CampaignPerformance[]> {
  const supabase = createServiceClient();
  const [campaigns, { data: events, error }] = await Promise.all([
    getAllCampaigns(),
    supabase.from("metrics_events").select("event_type, metadata").in("event_type", ["ad_impression", "ad_click"]),
  ]);
  if (error) throw error;

  const counts = new Map<string, { impressions: number; clicks: number }>();
  for (const row of events ?? []) {
    const campaignId = (row.metadata as Record<string, unknown> | null)?.campaignId;
    if (typeof campaignId !== "string") continue;
    const entry = counts.get(campaignId) ?? { impressions: 0, clicks: 0 };
    if (row.event_type === "ad_impression") entry.impressions += 1;
    else entry.clicks += 1;
    counts.set(campaignId, entry);
  }

  return campaigns
    .map((campaign) => {
      const metrics = counts.get(campaign.id) ?? { impressions: 0, clicks: 0 };
      return {
        campaignId: campaign.id,
        title: campaign.title,
        advertiserName: campaign.advertiserName,
        placementName: campaign.placementName,
        status: campaign.status,
        impressions: metrics.impressions,
        clicks: metrics.clicks,
        ctr: metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0,
      };
    })
    .sort((a, b) => b.impressions - a.impressions);
}

export type DailyTrendPoint = { day: string; pageViews: number; whatsappClicks: number };

/** Série diária (visualizações + cliques WhatsApp, somados de todas as
 * empresas) pro gráfico de tendência de `/admin/resultados` -- mesma fonte
 * (`analytics_daily`) de `getBusinessPerformance`, só que sem agrupar por
 * empresa. Dia sem nenhum evento entra com zero, pra não abrir buraco na
 * linha (silêncio real vira zero, não vira lacuna). */
export async function getDailyTrend(days: number): Promise<DailyTrendPoint[]> {
  const supabase = createServiceClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("analytics_daily")
    .select("day, event_type, count")
    .in("event_type", ["commercial_page_viewed", "whatsapp_clicked"])
    .gte("day", sinceStr);
  if (error) throw error;

  const byDay = new Map<string, { pageViews: number; whatsappClicks: number }>();
  for (const row of data ?? []) {
    const current = byDay.get(row.day) ?? { pageViews: 0, whatsappClicks: 0 };
    if (row.event_type === "commercial_page_viewed") current.pageViews += row.count;
    else current.whatsappClicks += row.count;
    byDay.set(row.day, current);
  }

  const points: DailyTrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const day = date.toISOString().slice(0, 10);
    const entry = byDay.get(day) ?? { pageViews: 0, whatsappClicks: 0 };
    points.push({ day, ...entry });
  }
  return points;
}

export type AdOccupancy = { total: number; occupied: number; vacant: number; percentage: number };

/** % de espaços de publicidade ocupados agora (ativo ou reservado) vs. total
 * cadastrado -- reaproveita getPlacementsInventory (ads.ts), mesma lógica
 * usada em /admin/publicidade/espacos. */
export async function getAdOccupancy(): Promise<AdOccupancy> {
  const inventory = await getPlacementsInventory();
  const total = inventory.length;
  const occupied = inventory.filter((p) => p.status === "ativo" || p.status === "reservado").length;
  return { total, occupied, vacant: total - occupied, percentage: total > 0 ? (occupied / total) * 100 : 0 };
}
