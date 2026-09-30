import { createServiceClient } from "@/lib/supabase/server";
import type { ContentChannel } from "@/lib/services/content-calendar";

export type CampaignState = "rascunho" | "aguardando_aprovacao" | "aprovada" | "ativa" | "encerrada" | "cancelada";

export const CAMPAIGN_STATE_ORDER: CampaignState[] = [
  "rascunho",
  "aguardando_aprovacao",
  "aprovada",
  "ativa",
  "encerrada",
  "cancelada",
];

export const CAMPAIGN_STATE_LABEL: Record<CampaignState, string> = {
  rascunho: "Rascunho",
  aguardando_aprovacao: "Aguardando aprovação",
  aprovada: "Aprovada",
  ativa: "Ativa",
  encerrada: "Encerrada",
  cancelada: "Cancelada",
};

export type MarketingCampaign = {
  id: string;
  name: string;
  objective: string | null;
  businessId: string | null;
  businessName: string | null;
  audienceId: string | null;
  audienceName: string | null;
  startsOn: string;
  endsOn: string;
  budgetCents: number | null;
  channels: ContentChannel[];
  status: CampaignState;
  ownerAdminId: string | null;
  ownerEmail: string | null;
  approvedByEmail: string | null;
  approvedAt: string | null;
  manualViews: number;
  manualClicks: number;
  resultsNotes: string | null;
};

export type MarketingCampaignInput = {
  name: string;
  objective: string | null;
  businessId: string | null;
  audienceId: string | null;
  startsOn: string;
  endsOn: string;
  budgetCents: number | null;
  channels: ContentChannel[];
  ownerAdminId: string | null;
};

export type CampaignCreative = {
  id: string;
  title: string;
  channel: ContentChannel | null;
  assetUrl: string | null;
  notes: string | null;
};

type CampaignRow = {
  id: string;
  name: string;
  objective: string | null;
  business_id: string | null;
  audience_id: string | null;
  starts_on: string;
  ends_on: string;
  budget_cents: number | null;
  channels: ContentChannel[];
  status: CampaignState;
  owner_admin_id: string | null;
  approved_at: string | null;
  manual_views: number;
  manual_clicks: number;
  results_notes: string | null;
  businesses: { name: string } | null;
  marketing_audiences: { name: string } | null;
  owner: { email: string } | null;
  approver: { email: string } | null;
};

const CAMPAIGN_SELECT =
  "id, name, objective, business_id, audience_id, starts_on, ends_on, budget_cents, channels, status, owner_admin_id, approved_at, manual_views, manual_clicks, results_notes, businesses(name), marketing_audiences(name), owner:admins!owner_admin_id(email), approver:admins!approved_by(email)";

function mapCampaign(row: CampaignRow): MarketingCampaign {
  return {
    id: row.id,
    name: row.name,
    objective: row.objective,
    businessId: row.business_id,
    businessName: row.businesses?.name ?? null,
    audienceId: row.audience_id,
    audienceName: row.marketing_audiences?.name ?? null,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    budgetCents: row.budget_cents,
    channels: row.channels ?? [],
    status: row.status,
    ownerAdminId: row.owner_admin_id,
    ownerEmail: row.owner?.email ?? null,
    approvedByEmail: row.approver?.email ?? null,
    approvedAt: row.approved_at,
    manualViews: row.manual_views,
    manualClicks: row.manual_clicks,
    resultsNotes: row.results_notes,
  };
}

function campaignColumns(input: MarketingCampaignInput) {
  return {
    name: input.name.trim(),
    objective: input.objective,
    business_id: input.businessId,
    audience_id: input.audienceId,
    starts_on: input.startsOn,
    ends_on: input.endsOn,
    budget_cents: input.budgetCents,
    channels: input.channels,
    owner_admin_id: input.ownerAdminId,
  };
}

export async function getAllMarketingCampaigns(): Promise<MarketingCampaign[]> {
  const { data, error } = await createServiceClient()
    .from("marketing_campaigns")
    .select(CAMPAIGN_SELECT)
    .order("starts_on", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as CampaignRow[]).map(mapCampaign);
}

export async function getMarketingCampaignById(id: string): Promise<MarketingCampaign | null> {
  const { data, error } = await createServiceClient()
    .from("marketing_campaigns")
    .select(CAMPAIGN_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapCampaign(data as unknown as CampaignRow) : null;
}

export async function createMarketingCampaign(input: MarketingCampaignInput, adminId: string): Promise<string> {
  const { data, error } = await createServiceClient()
    .from("marketing_campaigns")
    .insert({ ...campaignColumns(input), created_by: adminId })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateMarketingCampaign(id: string, input: MarketingCampaignInput): Promise<void> {
  const { error } = await createServiceClient().from("marketing_campaigns").update(campaignColumns(input)).eq("id", id);
  if (error) throw error;
}

export async function setMarketingCampaignStatus(id: string, status: CampaignState, adminId: string): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (status === "aprovada") {
    patch.approved_by = adminId;
    patch.approved_at = new Date().toISOString();
  }
  const { error } = await createServiceClient().from("marketing_campaigns").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteMarketingCampaign(id: string): Promise<void> {
  const { error } = await createServiceClient().from("marketing_campaigns").delete().eq("id", id);
  if (error) throw error;
}

export async function updateManualResults(
  id: string,
  results: { views: number; clicks: number; notes: string | null },
): Promise<void> {
  const { error } = await createServiceClient()
    .from("marketing_campaigns")
    .update({ manual_views: results.views, manual_clicks: results.clicks, results_notes: results.notes })
    .eq("id", id);
  if (error) throw error;
}

// ── Peças criativas ──────────────────────────────────────────────────────

export async function getCampaignCreatives(campaignId: string): Promise<CampaignCreative[]> {
  const { data, error } = await createServiceClient()
    .from("marketing_campaign_creatives")
    .select("id, title, channel, asset_url, notes")
    .eq("campaign_id", campaignId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    channel: row.channel,
    assetUrl: row.asset_url,
    notes: row.notes,
  }));
}

export async function addCampaignCreative(
  campaignId: string,
  creative: Omit<CampaignCreative, "id">,
): Promise<void> {
  const { error } = await createServiceClient().from("marketing_campaign_creatives").insert({
    campaign_id: campaignId,
    title: creative.title.trim(),
    channel: creative.channel,
    asset_url: creative.assetUrl,
    notes: creative.notes,
  });
  if (error) throw error;
}

export async function deleteCampaignCreative(id: string): Promise<void> {
  const { error } = await createServiceClient().from("marketing_campaign_creatives").delete().eq("id", id);
  if (error) throw error;
}
