import { createServiceClient } from "@/lib/supabase/server";
import { getOpportunities, getBenefits } from "@/lib/services/platform";

export type AdminDashboardStats = {
  recentSignups7d: number;
  activeCampaigns: number;
  searchesLast30d: number;
  adImpressionsLast30d: number;
  adClicksLast30d: number;
  activeOpportunities: number;
  activePromotions: number;
  incompleteProfiles: number;
};

/** Métricas reais do painel — sem linha correspondente, o número é 0, nunca
 * inventado (ver Seção 17 do plano: "não inventar métricas"). */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = createServiceClient();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const today = now.toISOString().slice(0, 10);

  const [
    signupsResult,
    campaignsResult,
    searchesResult,
    impressionsResult,
    clicksResult,
    opportunities,
    benefits,
    businessesResult,
    servicesResult,
    photosResult,
  ] = await Promise.all([
    supabase.from("businesses").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabase
      .from("ad_campaigns")
      .select("id, ad_accounts!inner(blocked)")
      .eq("status", "approved")
      .eq("ad_accounts.blocked", false)
      .lte("starts_at", today)
      .gte("ends_at", today),
    supabase
      .from("metrics_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "search_performed")
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("metrics_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "ad_impression")
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("metrics_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "ad_click")
      .gte("created_at", thirtyDaysAgo),
    getOpportunities(),
    getBenefits(),
    supabase.from("businesses").select("id, description").eq("status", "approved"),
    supabase.from("business_services").select("business_id"),
    supabase.from("business_photos").select("business_id"),
  ]);

  const servicedIds = new Set((servicesResult.data ?? []).map((row) => row.business_id as string));
  const photographedIds = new Set((photosResult.data ?? []).map((row) => row.business_id as string));
  const incompleteProfiles = (businessesResult.data ?? []).filter(
    (business) =>
      !business.description?.trim() || !servicedIds.has(business.id) || !photographedIds.has(business.id),
  ).length;

  return {
    recentSignups7d: signupsResult.count ?? 0,
    activeCampaigns: (campaignsResult.data ?? []).length,
    searchesLast30d: searchesResult.count ?? 0,
    adImpressionsLast30d: impressionsResult.count ?? 0,
    adClicksLast30d: clicksResult.count ?? 0,
    activeOpportunities: opportunities.length,
    activePromotions: benefits.length,
    incompleteProfiles,
  };
}
