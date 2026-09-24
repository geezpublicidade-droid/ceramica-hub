import { createServiceClient } from "@/lib/supabase/server";

export type AdPlacement = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  width: number;
  height: number;
  monthlyPriceCents: number | null;
  active: boolean;
};

function mapPlacement(row: {
  id: string;
  key: string;
  name: string;
  description: string | null;
  width: number;
  height: number;
  monthly_price_cents: number | null;
  active: boolean;
}): AdPlacement {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    width: row.width,
    height: row.height,
    monthlyPriceCents: row.monthly_price_cents,
    active: row.active,
  };
}

export async function getAllPlacements(): Promise<AdPlacement[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("ad_placements").select("*").order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapPlacement);
}

export type ActiveCampaignCreative = { device: "desktop" | "mobile"; imageUrl: string; altText: string };

export type ActiveCampaign = {
  id: string;
  title: string;
  description: string | null;
  targetUrl: string;
  creatives: ActiveCampaignCreative[];
};

async function fetchEligibleCampaigns(placementKey: string): Promise<ActiveCampaign[]> {
  const supabase = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: placement } = await supabase.from("ad_placements").select("id").eq("key", placementKey).maybeSingle();
  if (!placement) return [];

  const { data: campaigns, error } = await supabase
    .from("ad_campaigns")
    .select("id, title, description, target_url, ad_accounts!inner(blocked), ad_creatives(device, image_url, alt_text)")
    .eq("placement_id", placement.id)
    .eq("status", "approved")
    .eq("ad_accounts.blocked", false)
    .lte("starts_at", today)
    .gte("ends_at", today);
  if (error) throw error;

  return (campaigns ?? []).map((campaign) => ({
    id: campaign.id,
    title: campaign.title,
    description: campaign.description,
    targetUrl: campaign.target_url,
    creatives: (campaign.ad_creatives as unknown as { device: "desktop" | "mobile"; image_url: string; alt_text: string }[]).map(
      (c) => ({ device: c.device, imageUrl: c.image_url, altText: c.alt_text })
    ),
  }));
}

/**
 * Campanha aprovada, dentro do período e do anunciante não-bloqueado, pra
 * essa posição — usado pela renderização pública (AdSlot). Sem RLS de
 * verdade (ver decisão em auth-guards.ts), mas essa função não recebe
 * nenhum dado do usuário além do placementKey (constante no código-fonte,
 * não vem de input externo), então não há superfície de IDOR aqui.
 */
export async function getActiveCampaignForPlacement(placementKey: string): Promise<ActiveCampaign | null> {
  const campaigns = await fetchEligibleCampaigns(placementKey);
  if (campaigns.length === 0) return null;

  // Frequência: com mais de uma campanha elegível pra mesma posição no
  // mesmo período, roda entre elas em vez de sempre mostrar a primeira —
  // cada view sorteia uma, distribuindo impressão entre anunciantes pagantes.
  return campaigns[Math.floor(Math.random() * campaigns.length)];
}

/** Igual acima, mas devolve todas as elegíveis (embaralhadas) -- usado pelo carrossel, que mostra vários anunciantes ao mesmo tempo em vez de só um. */
export async function getActiveCampaignsForPlacement(placementKey: string): Promise<ActiveCampaign[]> {
  const campaigns = await fetchEligibleCampaigns(placementKey);
  return campaigns
    .map((campaign) => ({ campaign, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ campaign }) => campaign);
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

export type PlacementInventoryStatus = "vago" | "reservado" | "ativo" | "expirando" | "aguardando_revisao";

export type PlacementInventory = AdPlacement & {
  status: PlacementInventoryStatus;
  occupant: { campaignId: string; title: string; advertiserName: string; startsAt: string; endsAt: string } | null;
  pendingCount: number;
};

/** Visão de inventário pro admin: pra cada posição cadastrada, qual é o
 * estado comercial dela agora -- vago, reservado (aprovada mas ainda não
 * começou), ativa, expirando (ativa e termina em até 7 dias) ou aguardando
 * revisão (tem proposta pendente de aprovação). Usado em
 * /admin/publicidade/espacos, separado de getAllCampaigns (que lista
 * campanhas soltas, não o inventário de posições). */
export async function getPlacementsInventory(): Promise<PlacementInventory[]> {
  const supabase = createServiceClient();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [{ data: placements, error: placementsError }, { data: campaigns, error: campaignsError }] = await Promise.all([
    supabase.from("ad_placements").select("*").order("name", { ascending: true }),
    supabase
      .from("ad_campaigns")
      .select("id, placement_id, title, status, starts_at, ends_at, ad_accounts(company_name)")
      .in("status", ["pending_review", "approved"]),
  ]);
  if (placementsError) throw placementsError;
  if (campaignsError) throw campaignsError;

  type CampaignRow = {
    id: string;
    placement_id: string;
    title: string;
    status: string;
    starts_at: string;
    ends_at: string;
    ad_accounts: { company_name: string } | null;
  };

  return (placements ?? []).map((placementRow) => {
    const placement = mapPlacement(placementRow);
    const forThisPlacement = ((campaigns ?? []) as unknown as CampaignRow[]).filter(
      (c) => c.placement_id === placement.id
    );

    const activeNow = forThisPlacement.find(
      (c) => c.status === "approved" && c.starts_at <= todayStr && c.ends_at >= todayStr
    );
    const upcoming = forThisPlacement
      .filter((c) => c.status === "approved" && c.starts_at > todayStr)
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
    const pendingCount = forThisPlacement.filter((c) => c.status === "pending_review").length;

    const occupantRow = activeNow ?? upcoming;
    const occupant = occupantRow
      ? {
          campaignId: occupantRow.id,
          title: occupantRow.title,
          advertiserName: occupantRow.ad_accounts?.company_name ?? "Anunciante",
          startsAt: occupantRow.starts_at,
          endsAt: occupantRow.ends_at,
        }
      : null;

    let status: PlacementInventoryStatus = "vago";
    if (activeNow) status = activeNow.ends_at <= in7Days ? "expirando" : "ativo";
    else if (upcoming) status = "reservado";
    else if (pendingCount > 0) status = "aguardando_revisao";

    return { ...placement, status, occupant, pendingCount };
  });
}
