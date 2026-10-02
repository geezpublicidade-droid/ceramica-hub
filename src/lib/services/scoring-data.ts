import { createServiceClient } from "@/lib/supabase/server";
import { getAllLeads, type Lead } from "@/lib/services/leads";
import { scoreCustomer, scoreLead, type CustomerHealth, type LeadScore } from "@/lib/services/scoring";

const DAY_MS = 24 * 60 * 60 * 1000;
const ENGAGEMENT_DAYS = 30;
const CLOSED_STAGES = ["fechado", "perdido"];
const OPEN_PROPOSAL_STATUSES = ["enviada", "visualizada", "negociacao"];

export type ScoredLead = { lead: Lead; score: LeadScore };

/** Leads em andamento pontuados e ordenados do mais quente ao mais frio. */
export async function getScoredLeads(): Promise<ScoredLead[]> {
  const [leads, proposals] = await Promise.all([
    getAllLeads(),
    createServiceClient().from("proposals").select("lead_id, status").not("lead_id", "is", null).in("status", OPEN_PROPOSAL_STATUSES),
  ]);
  if (proposals.error) throw proposals.error;

  const byLead = new Map<string, { open: number; viewed: boolean }>();
  for (const row of proposals.data ?? []) {
    const entry = byLead.get(row.lead_id) ?? { open: 0, viewed: false };
    byLead.set(row.lead_id, { open: entry.open + 1, viewed: entry.viewed || row.status !== "enviada" });
  }

  return leads
    .filter((lead) => !CLOSED_STAGES.includes(lead.stage))
    .map((lead) => {
      const proposal = byLead.get(lead.id);
      return { lead, score: scoreLead(lead, { openProposals: proposal?.open ?? 0, proposalViewed: proposal?.viewed ?? false }) };
    })
    .sort((a, b) => b.score.score - a.score.score);
}

export type Engagement = { views: number; clicks: number; prevViews: number; prevClicks: number };

/** Visitas e cliques de cada empresa nos últimos 30 dias e nos 30 anteriores (função SQL `business_engagement`). */
export async function getBusinessEngagement(): Promise<Map<string, Engagement>> {
  const { data, error } = await createServiceClient().rpc("business_engagement", { p_days: ENGAGEMENT_DAYS });
  if (error) throw error;
  const map = new Map<string, Engagement>();
  for (const row of (data ?? []) as {
    business_id: string;
    views: number;
    clicks: number;
    prev_views: number;
    prev_clicks: number;
  }[]) {
    map.set(row.business_id, { views: row.views, clicks: row.clicks, prevViews: row.prev_views, prevClicks: row.prev_clicks });
  }
  return map;
}

export type ScoredCustomer = {
  businessId: string;
  name: string;
  plan: string;
  category: string;
  createdAt: string;
  engagement: Engagement;
  health: CustomerHealth;
};

const NO_ENGAGEMENT: Engagement = { views: 0, clicks: 0, prevViews: 0, prevClicks: 0 };

type ContractState = { pastDue: boolean; daysToEnd: number | null };

/** Assinatura que manda no estado: em atraso vence ativa; entre ativas vale o prazo mais próximo. */
function contractStates(rows: { business_id: string; status: string; ends_at: string | null }[], now: Date): Map<string, ContractState> {
  const map = new Map<string, ContractState>();
  for (const row of rows) {
    const days = row.ends_at ? Math.ceil((new Date(row.ends_at).getTime() - now.getTime()) / DAY_MS) : null;
    const current = map.get(row.business_id) ?? { pastDue: false, daysToEnd: null };
    map.set(row.business_id, {
      pastDue: current.pastDue || row.status === "past_due",
      daysToEnd: days === null ? current.daysToEnd : current.daysToEnd === null ? days : Math.min(current.daysToEnd, days),
    });
  }
  return map;
}

/** Empresas aprovadas com saúde calculada, das que mais precisam de atenção para as mais saudáveis. */
export async function getScoredCustomers(now = new Date()): Promise<ScoredCustomer[]> {
  const supabase = createServiceClient();
  const [businesses, subscriptions, engagement] = await Promise.all([
    supabase.from("businesses").select("id, name, plan, category, created_at, logo_url, description").eq("status", "approved"),
    supabase.from("subscriptions").select("business_id, status, ends_at").in("status", ["active", "past_due"]),
    getBusinessEngagement(),
  ]);
  if (businesses.error) throw businesses.error;
  if (subscriptions.error) throw subscriptions.error;
  const contracts = contractStates(subscriptions.data ?? [], now);

  return (businesses.data ?? [])
    .map((business) => {
      const eng = engagement.get(business.id) ?? NO_ENGAGEMENT;
      const contract = contracts.get(business.id);
      const health = scoreCustomer({
        pastDue: contract?.pastDue ?? false,
        daysToContractEnd: contract?.daysToEnd ?? null,
        ageDays: Math.floor((now.getTime() - new Date(business.created_at).getTime()) / DAY_MS),
        views: eng.views,
        prevViews: eng.prevViews,
        clicks: eng.clicks,
        profileComplete: Boolean(business.logo_url && business.description),
      });
      return {
        businessId: business.id,
        name: business.name,
        plan: business.plan,
        category: business.category,
        createdAt: business.created_at,
        engagement: eng,
        health,
      };
    })
    .sort((a, b) => a.health.score - b.health.score);
}
