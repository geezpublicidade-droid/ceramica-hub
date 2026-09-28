import { createServiceClient } from "@/lib/supabase/server";
import { getContactsByBusiness, type Contact } from "@/lib/services/contacts";
import { getTasksByEntity, type Task } from "@/lib/services/tasks";

/** Agregador da Empresa 360° (ver prompt mestre da reforma do admin) --
 * reúne dado que já existe espalhado em várias tabelas numa única leitura
 * pra alimentar as abas da página `/admin/empresas/[id]`. Não inventa
 * número: toda seção sem linha no banco chega vazia pro componente decidir
 * o estado vazio, nunca um valor decorativo calculado aqui. */

export type CompanyProfile = {
  id: string;
  name: string;
  email: string;
  category: string;
  plan: string;
  status: string;
  slug: string | null;
  phone: string;
  instagram: string | null;
  websiteUrl: string | null;
  description: string | null;
  logoUrl: string | null;
  coverPhotoUrl: string | null;
  towerName: string | null;
  floor: string;
  roomNumber: string;
  founder: boolean;
  trialStatus: string | null;
  addressVerified: boolean;
  rejectionReason: string | null;
  createdAt: string;
};

export type CompanySubscription = {
  id: string;
  plan: string;
  status: string;
  startedAt: string | null;
  endsAt: string | null;
  createdAt: string;
};

export type CompanyInvoice = {
  id: string;
  amountCents: number;
  status: string;
  mercadopagoLink: string | null;
  confirmedAt: string | null;
  createdAt: string;
};

export type CompanyOpportunity = { id: string; type: string; title: string; description: string | null; active: boolean };

export type CompanySupportTicket = { id: string; subject: string; status: string; createdAt: string };

export type CompanyAdCampaign = { id: string; title: string; status: string; placementName: string; startsAt: string; endsAt: string };

export type CompanyHistoryEntry = { id: string; action: string; createdAt: string; metadata: Record<string, unknown> | null };

export type CompanyMetrics = {
  totalsByType: { eventType: string; count: number }[];
  last30dByType: { eventType: string; count: number }[];
};

export type Company360 = {
  profile: CompanyProfile;
  contacts: Contact[];
  photos: { id: string; url: string }[];
  benefits: { id: string; title: string; description: string | null; active: boolean }[];
  subscriptions: CompanySubscription[];
  invoices: CompanyInvoice[];
  opportunities: CompanyOpportunity[];
  supportTickets: CompanySupportTicket[];
  adCampaigns: CompanyAdCampaign[];
  metrics: CompanyMetrics;
  history: CompanyHistoryEntry[];
  tasks: Task[];
};

export async function getCompany360(businessId: string): Promise<Company360 | null> {
  const supabase = createServiceClient();

  const { data: businessRow, error: businessError } = await supabase
    .from("businesses")
    .select(
      "id, name, email, category, plan, status, slug, phone, instagram, website_url, description, logo_url, cover_photo_url, floor, room_number, founder, trial_status, address_verified, rejection_reason, created_at, towers(name)"
    )
    .eq("id", businessId)
    .maybeSingle();
  if (businessError) throw businessError;
  if (!businessRow) return null;

  const towers = businessRow.towers as unknown as { name: string } | null;
  const profile: CompanyProfile = {
    id: businessRow.id,
    name: businessRow.name,
    email: businessRow.email,
    category: businessRow.category,
    plan: businessRow.plan,
    status: businessRow.status,
    slug: businessRow.slug,
    phone: businessRow.phone,
    instagram: businessRow.instagram,
    websiteUrl: businessRow.website_url,
    description: businessRow.description,
    logoUrl: businessRow.logo_url,
    coverPhotoUrl: businessRow.cover_photo_url,
    towerName: towers?.name ?? null,
    floor: businessRow.floor,
    roomNumber: businessRow.room_number,
    founder: businessRow.founder,
    trialStatus: businessRow.trial_status,
    addressVerified: businessRow.address_verified,
    rejectionReason: businessRow.rejection_reason,
    createdAt: businessRow.created_at,
  };

  const [
    contacts,
    photosResult,
    benefitsResult,
    subscriptionsResult,
    invoicesResult,
    opportunitiesResult,
    ticketsResult,
    adAccountResult,
    metricsResult,
    historyResult,
    tasks,
  ] = await Promise.all([
    getContactsByBusiness(businessId),
    supabase.from("business_photos").select("id, url").eq("business_id", businessId).order("sort_order"),
    supabase.from("benefits").select("id, title, description, active").eq("business_id", businessId),
    supabase
      .from("subscriptions")
      .select("id, plan, status, started_at, ends_at, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("id, amount_cents, status, mercadopago_link, confirmed_at, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false }),
    supabase.from("opportunities").select("id, type, title, description, active").eq("business_id", businessId),
    supabase
      .from("support_tickets")
      .select("id, subject, status, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false }),
    // Empresa do complexo que também é anunciante -- `ad_accounts` não tem
    // FK pra `businesses` (conceitualmente são coisas distintas, ver
    // CONCEITO DO SISTEMA do prompt mestre), então o único jeito de achar a
    // conta de anunciante correspondente hoje é por e-mail igual. Se a
    // empresa nunca virou anunciante, ou usou um e-mail diferente ali, essa
    // aba fica vazia -- heurística, não FK de verdade.
    supabase.from("ad_accounts").select("id").eq("email", businessRow.email).maybeSingle(),
    supabase.from("metrics_events").select("event_type, created_at").eq("business_id", businessId),
    supabase
      .from("audit_logs")
      .select("id, action, created_at, metadata")
      .eq("entity_type", "business")
      .eq("entity_id", businessId)
      .order("created_at", { ascending: false }),
    getTasksByEntity("business", businessId),
  ]);

  let adCampaigns: CompanyAdCampaign[] = [];
  if (adAccountResult.data) {
    const { data: campaignsData } = await supabase
      .from("ad_campaigns")
      .select("id, title, status, starts_at, ends_at, ad_placements(name)")
      .eq("ad_account_id", adAccountResult.data.id)
      .order("created_at", { ascending: false });
    adCampaigns = (campaignsData ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      placementName: (row.ad_placements as unknown as { name: string } | null)?.name ?? "—",
      startsAt: row.starts_at,
      endsAt: row.ends_at,
    }));
  }

  const metricsRows = metricsResult.data ?? [];
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const totalsMap = new Map<string, number>();
  const last30dMap = new Map<string, number>();
  for (const row of metricsRows) {
    totalsMap.set(row.event_type, (totalsMap.get(row.event_type) ?? 0) + 1);
    if (new Date(row.created_at).getTime() >= thirtyDaysAgo) {
      last30dMap.set(row.event_type, (last30dMap.get(row.event_type) ?? 0) + 1);
    }
  }

  return {
    profile,
    contacts,
    photos: photosResult.data ?? [],
    benefits: benefitsResult.data ?? [],
    subscriptions: (subscriptionsResult.data ?? []).map((row) => ({
      id: row.id,
      plan: row.plan,
      status: row.status,
      startedAt: row.started_at,
      endsAt: row.ends_at,
      createdAt: row.created_at,
    })),
    invoices: (invoicesResult.data ?? []).map((row) => ({
      id: row.id,
      amountCents: row.amount_cents,
      status: row.status,
      mercadopagoLink: row.mercadopago_link,
      confirmedAt: row.confirmed_at,
      createdAt: row.created_at,
    })),
    opportunities: opportunitiesResult.data ?? [],
    supportTickets: (ticketsResult.data ?? []).map((row) => ({
      id: row.id,
      subject: row.subject,
      status: row.status,
      createdAt: row.created_at,
    })),
    adCampaigns,
    metrics: {
      totalsByType: Array.from(totalsMap, ([eventType, count]) => ({ eventType, count })),
      last30dByType: Array.from(last30dMap, ([eventType, count]) => ({ eventType, count })),
    },
    history: (historyResult.data ?? []).map((row) => ({
      id: row.id,
      action: row.action,
      createdAt: row.created_at,
      metadata: row.metadata,
    })),
    tasks,
  };
}
