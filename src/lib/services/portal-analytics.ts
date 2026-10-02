import { createServiceClient } from "@/lib/supabase/server";

export type RankedItem = { label: string; total: number };
export type BusinessReach = { label: string; views: number; clicks: number };

export type PortalAnalytics = {
  visits: number;
  topPages: RankedItem[];
  topSources: RankedItem[];
  topCategories: RankedItem[];
  topSearches: RankedItem[];
  noResultSearches: RankedItem[];
  clicks: { whatsapp: number; phone: number; website: number; directions: number };
  topBusinesses: BusinessReach[];
  dailyVisits: { day: string; total: number }[];
};

type RawAnalytics = {
  visits: number;
  top_pages: RankedItem[];
  top_sources: RankedItem[];
  top_categories: RankedItem[];
  top_searches: RankedItem[];
  no_result_searches: RankedItem[];
  clicks: PortalAnalytics["clicks"];
  top_businesses: BusinessReach[];
  daily_visits: { day: string; total: number }[];
};

/** Últimos `days` dias (relógio do banco). A agregação roda no banco (função `portal_analytics`, migration 0062). */
export async function getPortalAnalytics(days: number): Promise<PortalAnalytics> {
  const { data, error } = await createServiceClient().rpc("portal_analytics", { p_days: days });
  if (error) throw error;
  const raw = data as RawAnalytics;
  return {
    visits: raw.visits,
    topPages: raw.top_pages,
    topSources: raw.top_sources,
    topCategories: raw.top_categories,
    topSearches: raw.top_searches,
    noResultSearches: raw.no_result_searches,
    clicks: raw.clicks,
    topBusinesses: raw.top_businesses,
    dailyVisits: raw.daily_visits,
  };
}
