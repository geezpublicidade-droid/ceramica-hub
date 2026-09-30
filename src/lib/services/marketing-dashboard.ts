import { createServiceClient } from "@/lib/supabase/server";
import { countContentAwaitingApproval } from "@/lib/services/content-calendar";

const WINDOW_DAYS = 30;
const UPCOMING_DAYS = 14;
const CLOSED_CONTENT = ["publicado", "cancelado"];
const LIVE_AD_STATUSES = ["approved", "scheduled", "active"];

export type UpcomingAction = { id: string; title: string; status: string; scheduledFor: string; businessName: string | null };

export type MarketingDashboard = {
  campaignsActive: number;
  campaignsScheduled: number;
  campaignsAwaitingApproval: number;
  contentAwaitingApproval: number;
  emailsSent: number;
  emailOpens: number;
  emailClicks: number;
  adsContracted: number;
  adImpressions: number;
  adClicks: number;
  leads: number;
  upcoming: UpcomingAction[];
};

type Supabase = ReturnType<typeof createServiceClient>;

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

async function count(query: PromiseLike<{ count: number | null; error: unknown }>): Promise<number> {
  const { count: total, error } = await query;
  if (error) throw error;
  return total ?? 0;
}

async function campaignCounts(supabase: Supabase) {
  const head = { count: "exact", head: true } as const;
  const byStatus = (status: string) => count(supabase.from("marketing_campaigns").select("id", head).eq("status", status));
  const [active, scheduled, awaiting] = await Promise.all([
    byStatus("ativa"),
    byStatus("aprovada"),
    byStatus("aguardando_aprovacao"),
  ]);
  return { active, scheduled, awaiting };
}

async function emailTotals(supabase: Supabase) {
  const since = daysFromNow(-WINDOW_DAYS);
  const head = { count: "exact", head: true } as const;
  const sends = () => supabase.from("email_sends").select("id", head).gte("created_at", since);
  const [sent, opens, clicks] = await Promise.all([
    count(sends().eq("status", "sent")),
    count(sends().not("opened_at", "is", null)),
    count(sends().not("clicked_at", "is", null)),
  ]);
  return { sent, opens, clicks };
}

async function adTotals(supabase: Supabase) {
  const since = daysFromNow(-WINDOW_DAYS);
  const head = { count: "exact", head: true } as const;
  const events = (type: string) =>
    count(supabase.from("metrics_events").select("id", head).eq("event_type", type).gte("created_at", since));
  const [contracted, impressions, clicks] = await Promise.all([
    count(supabase.from("ad_campaigns").select("id", head).in("status", LIVE_AD_STATUSES)),
    events("ad_impression"),
    events("ad_click"),
  ]);
  return { contracted, impressions, clicks };
}

async function upcomingActions(supabase: Supabase): Promise<UpcomingAction[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("content_items")
    .select("id, title, status, scheduled_for, businesses(name)")
    .gte("scheduled_for", today)
    .lte("scheduled_for", daysFromNow(UPCOMING_DAYS).slice(0, 10))
    .not("status", "in", `(${CLOSED_CONTENT.join(",")})`)
    .order("scheduled_for")
    .limit(10);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    scheduledFor: row.scheduled_for,
    businessName: (row.businesses as unknown as { name: string } | null)?.name ?? null,
  }));
}

/** Leads que chegaram por alguma campanha (vínculo marketing_campaign_id). */
async function campaignLeads(supabase: Supabase): Promise<number> {
  return count(
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .not("marketing_campaign_id", "is", null)
      .gte("created_at", daysFromNow(-WINDOW_DAYS)),
  );
}

export async function getMarketingDashboard(): Promise<MarketingDashboard> {
  const supabase = createServiceClient();
  const [campaigns, contentAwaiting, email, ads, leads, upcoming] = await Promise.all([
    campaignCounts(supabase),
    countContentAwaitingApproval(),
    emailTotals(supabase),
    adTotals(supabase),
    campaignLeads(supabase),
    upcomingActions(supabase),
  ]);
  return {
    campaignsActive: campaigns.active,
    campaignsScheduled: campaigns.scheduled,
    campaignsAwaitingApproval: campaigns.awaiting,
    contentAwaitingApproval: contentAwaiting,
    emailsSent: email.sent,
    emailOpens: email.opens,
    emailClicks: email.clicks,
    adsContracted: ads.contracted,
    adImpressions: ads.impressions,
    adClicks: ads.clicks,
    leads,
    upcoming,
  };
}

export const DASHBOARD_WINDOW_DAYS = WINDOW_DAYS;
