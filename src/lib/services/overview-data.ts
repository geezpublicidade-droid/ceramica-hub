import { createServiceClient } from "@/lib/supabase/server";
import { addDays } from "@/lib/ad-schedule";
import { getAgendaItems } from "@/lib/services/agenda-data";
import { getStoreSpaces } from "@/lib/services/ad-store";
import { buildTimeline, type AgendaItem } from "@/lib/agenda";
import { buildRecommendations, type Recommendation } from "@/lib/marketing-recommendations";
import { summarizeOverview, type OverviewStats } from "@/lib/overview-stats";

const PERIOD_DAYS = 30;
const EVENT_ROW_LIMIT = 30000;

export type OverviewData = {
  stats: OverviewStats;
  today: { views: number; contacts: number };
  leads: { current: number; previous: number; unanswered: number };
  timeline: { today: AgendaItem[]; upcoming: AgendaItem[] };
  recommendations: Recommendation[];
};

type CountInput = { businessId: string; plan: string; photoCount: number; hasActivePromotion: boolean };

async function loadEventRows(businessId: string, since: string) {
  const { data, error } = await createServiceClient()
    .from("metrics_events")
    .select("event_type, created_at")
    .eq("business_id", businessId)
    .gte("created_at", since)
    .limit(EVENT_ROW_LIMIT);
  if (error) throw error;
  return (data ?? []).map((row) => ({ eventType: row.event_type as string, createdAt: row.created_at as string }));
}

async function loadLeadCounts(businessId: string, now: Date) {
  const supabase = createServiceClient();
  const startCurrent = new Date(now.getTime() - PERIOD_DAYS * 86_400_000).toISOString();
  const startPrevious = new Date(now.getTime() - 2 * PERIOD_DAYS * 86_400_000).toISOString();
  const base = () => supabase.from("business_leads").select("id", { count: "exact", head: true }).eq("business_id", businessId);
  const [current, previous, unanswered] = await Promise.all([
    base().gte("created_at", startCurrent),
    base().gte("created_at", startPrevious).lt("created_at", startCurrent),
    base().eq("status", "novo"),
  ]);
  return { current: current.count ?? 0, previous: previous.count ?? 0, unanswered: unanswered.count ?? 0 };
}

const BRT_OFFSET_MS = -3 * 3_600_000;
const CONTACT_EVENTS = ["whatsapp_clicked", "phone_clicked", "directions_clicked", "appointment_clicked"];

/** Visualizações e contatos desde a meia-noite de Brasília. */
function countToday(rows: { eventType: string; createdAt: string }[], now: Date): { views: number; contacts: number } {
  const local = new Date(now.getTime() + BRT_OFFSET_MS);
  const midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - BRT_OFFSET_MS;
  const todayRows = rows.filter((row) => Date.parse(row.createdAt) >= midnight);
  return {
    views: todayRows.filter((row) => row.eventType === "commercial_page_viewed").length,
    contacts: todayRows.filter((row) => CONTACT_EVENTS.includes(row.eventType)).length,
  };
}

function daysUntil(date: string | undefined, today: string): number | null {
  if (!date) return null;
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

/** Tudo o que a visão geral precisa: números do mês com comparação, o que está acontecendo e o que fazer a seguir. */
export async function getOverviewData(input: CountInput): Promise<OverviewData> {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const since = new Date(now.getTime() - 2 * PERIOD_DAYS * 86_400_000).toISOString();
  const [rows, leads, agenda, spaces] = await Promise.all([
    loadEventRows(input.businessId, since),
    loadLeadCounts(input.businessId, now),
    getAgendaItems(input.businessId, today, addDays(today, 30)),
    getStoreSpaces().catch(() => []),
  ]);
  const stats = summarizeOverview(rows, now, PERIOD_DAYS);
  const timeline = buildTimeline(agenda, today);

  const nextEnd = (kind: AgendaItem["kind"]) =>
    agenda.filter((item) => item.kind === kind && item.tone !== "gray").map((item) => item.endDate ?? item.date).sort()[0];
  const free = spaces.find((space) => space.nextFreeStart);
  const upcomingLive = agenda.some((item) => item.date >= today && item.tone !== "gray" && item.kind !== "evento" && item.kind !== "promocao");

  const recommendations = buildRecommendations({
    plan: input.plan,
    photoCount: input.photoCount,
    hasActivePromotion: input.hasActivePromotion,
    promotionEndsInDays: daysUntil(nextEnd("promocao"), today),
    campaignEndsInDays: daysUntil(nextEnd("anuncio"), today),
    openSpace: free?.nextFreeStart ? { name: free.name, from: free.nextFreeStart } : null,
    peak: stats.peak,
    unansweredLeads: leads.unanswered,
    hasNoCampaignScheduled: !upcomingLive,
  });
  return { stats, today: countToday(rows, now), leads, timeline, recommendations };
}
