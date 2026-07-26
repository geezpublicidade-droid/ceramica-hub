import { createServiceClient } from "@/lib/supabase/server";

export type AdPlacement = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  width: number;
  height: number;
};

export async function getAllPlacements(): Promise<AdPlacement[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("ad_placements").select("*").order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    width: row.width,
    height: row.height,
  }));
}

export type ActiveCampaignCreative = { device: "desktop" | "mobile"; imageUrl: string; altText: string };

export type ActiveCampaign = {
  id: string;
  title: string;
  targetUrl: string;
  creatives: ActiveCampaignCreative[];
};

/**
 * Campanha aprovada, dentro do período e do anunciante não-bloqueado, pra
 * essa posição — usado pela renderização pública (AdSlot). Sem RLS de
 * verdade (ver decisão em auth-guards.ts), mas essa função não recebe
 * nenhum dado do usuário além do placementKey (constante no código-fonte,
 * não vem de input externo), então não há superfície de IDOR aqui.
 */
export async function getActiveCampaignForPlacement(placementKey: string): Promise<ActiveCampaign | null> {
  const supabase = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: placement } = await supabase.from("ad_placements").select("id").eq("key", placementKey).maybeSingle();
  if (!placement) return null;

  const { data: campaigns, error } = await supabase
    .from("ad_campaigns")
    .select("id, title, target_url, ad_accounts!inner(blocked), ad_creatives(device, image_url, alt_text)")
    .eq("placement_id", placement.id)
    .eq("status", "approved")
    .eq("ad_accounts.blocked", false)
    .lte("starts_at", today)
    .gte("ends_at", today);
  if (error) throw error;
  if (!campaigns || campaigns.length === 0) return null;

  // Frequência: com mais de uma campanha elegível pra mesma posição no
  // mesmo período, roda entre elas em vez de sempre mostrar a primeira —
  // cada view sorteia uma, distribuindo impressão entre anunciantes pagantes.
  const campaign = campaigns[Math.floor(Math.random() * campaigns.length)];

  return {
    id: campaign.id,
    title: campaign.title,
    targetUrl: campaign.target_url,
    creatives: (campaign.ad_creatives as unknown as { device: "desktop" | "mobile"; image_url: string; alt_text: string }[]).map(
      (c) => ({ device: c.device, imageUrl: c.image_url, altText: c.alt_text })
    ),
  };
}

export type CampaignWithDetails = {
  id: string;
  title: string;
  status: string;
  startsAt: string;
  endsAt: string;
  targetUrl: string;
  advertiserId: string;
  advertiserName: string;
  advertiserBlocked: boolean;
  placementName: string;
  rejectionReason: string | null;
};

export async function getAllCampaigns(): Promise<CampaignWithDetails[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ad_campaigns")
    .select(
      "id, title, status, starts_at, ends_at, target_url, rejection_reason, ad_accounts(id, company_name, blocked), ad_placements(name)"
    )
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const account = row.ad_accounts as unknown as { id: string; company_name: string; blocked: boolean } | null;
    const placement = row.ad_placements as unknown as { name: string } | null;
    return {
      id: row.id,
      title: row.title,
      status: row.status,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      targetUrl: row.target_url,
      advertiserId: account?.id ?? "",
      advertiserName: account?.company_name ?? "Anunciante",
      advertiserBlocked: account?.blocked ?? false,
      placementName: placement?.name ?? "—",
      rejectionReason: row.rejection_reason,
    };
  });
}

export type CampaignMetrics = { impressions: number; clicks: number; ctr: number };

export async function getCampaignMetrics(campaignId: string): Promise<CampaignMetrics> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("metrics_events")
    .select("event_type")
    .in("event_type", ["ad_impression", "ad_click"])
    .eq("metadata->>campaignId", campaignId);
  if (error) throw error;

  const impressions = (data ?? []).filter((row) => row.event_type === "ad_impression").length;
  const clicks = (data ?? []).filter((row) => row.event_type === "ad_click").length;

  return { impressions, clicks, ctr: impressions > 0 ? (clicks / impressions) * 100 : 0 };
}
