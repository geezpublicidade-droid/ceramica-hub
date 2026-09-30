import { createServiceClient } from "@/lib/supabase/server";
import { getCampaignMetrics } from "@/lib/services/ads";
import { computeStats, type CampaignStats, type SendStatsRow } from "@/lib/services/email-marketing";

export type LinkKind = "content" | "email" | "ad";

export const LINK_KIND_LABEL: Record<LinkKind, string> = {
  content: "Peça do calendário",
  email: "Disparo de e-mail",
  ad: "Anúncio",
};

export type LinkedItem = { id: string; label: string; status: string };

type LinkConfig = { table: string; labelColumn: string };

const LINK_CONFIG: Record<LinkKind, LinkConfig> = {
  content: { table: "content_items", labelColumn: "title" },
  email: { table: "email_campaigns", labelColumn: "name" },
  ad: { table: "ad_campaigns", labelColumn: "title" },
};

const LINK_KINDS = Object.keys(LINK_CONFIG) as LinkKind[];

export type CampaignLinks = Record<LinkKind, LinkedItem[]>;

async function fetchItems(kind: LinkKind, campaignId: string | null): Promise<LinkedItem[]> {
  const { table, labelColumn } = LINK_CONFIG[kind];
  const query = createServiceClient()
    .from(table)
    .select(`id, status, ${labelColumn}`)
    .order("created_at", { ascending: false })
    .limit(200);
  const { data, error } = await (campaignId ? query.eq("marketing_campaign_id", campaignId) : query.is("marketing_campaign_id", null));
  if (error) throw error;
  return ((data ?? []) as unknown as Record<string, string>[]).map((row) => ({
    id: row.id,
    label: row[labelColumn],
    status: row.status,
  }));
}

async function fetchAllKinds(campaignId: string | null): Promise<CampaignLinks> {
  const lists = await Promise.all(LINK_KINDS.map((kind) => fetchItems(kind, campaignId)));
  return { content: lists[0], email: lists[1], ad: lists[2] };
}

export function getLinkedItems(campaignId: string): Promise<CampaignLinks> {
  return fetchAllKinds(campaignId);
}

/** Itens ainda sem campanha, pra escolher no vínculo. */
export function getLinkableItems(): Promise<CampaignLinks> {
  return fetchAllKinds(null);
}

export async function setLink(kind: LinkKind, entityId: string, campaignId: string | null): Promise<void> {
  const { error } = await createServiceClient()
    .from(LINK_CONFIG[kind].table)
    .update({ marketing_campaign_id: campaignId })
    .eq("id", entityId);
  if (error) throw error;
}

export type CampaignResults = {
  leads: number;
  email: CampaignStats;
  adImpressions: number;
  adClicks: number;
  views: number;
  clicks: number;
};

async function countLeads(campaignId: string): Promise<number> {
  const { count, error } = await createServiceClient()
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("marketing_campaign_id", campaignId);
  if (error) throw error;
  return count ?? 0;
}

async function emailStats(emailCampaignIds: string[], leads: number): Promise<CampaignStats> {
  if (emailCampaignIds.length === 0) return computeStats([], leads);
  const { data, error } = await createServiceClient()
    .from("email_sends")
    .select("campaign_id, status, delivered_at, opened_at, clicked_at, unsubscribed_at")
    .in("campaign_id", emailCampaignIds);
  if (error) throw error;
  return computeStats((data ?? []) as SendStatsRow[], leads);
}

async function adTotals(adCampaignIds: string[]): Promise<{ impressions: number; clicks: number }> {
  const metrics = await Promise.all(adCampaignIds.map((id) => getCampaignMetrics(id)));
  return {
    impressions: metrics.reduce((sum, m) => sum + m.impressions, 0),
    clicks: metrics.reduce((sum, m) => sum + m.clicks, 0),
  };
}

/** Resultado consolidado: e-mail, anúncios e leads vêm dos vínculos; os
 * números manuais cobrem canais sem rastreio (mídia externa, Instagram). */
export async function getCampaignResults(
  campaignId: string,
  links: CampaignLinks,
  manual: { views: number; clicks: number },
): Promise<CampaignResults> {
  const [leads, ads] = await Promise.all([countLeads(campaignId), adTotals(links.ad.map((item) => item.id))]);
  const email = await emailStats(
    links.email.map((item) => item.id),
    leads,
  );
  return {
    leads,
    email,
    adImpressions: ads.impressions,
    adClicks: ads.clicks,
    views: ads.impressions + manual.views,
    clicks: ads.clicks + email.cliques + manual.clicks,
  };
}
