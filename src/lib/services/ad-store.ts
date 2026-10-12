import { createServiceClient } from "@/lib/supabase/server";
import { getCampaignMetrics, type CampaignMetrics } from "@/lib/services/ads";
import { addDays, firstAvailableStart, occupancyByDay, type Booking, type DayOccupancy } from "@/lib/ad-schedule";

export const STORE_HORIZON_DAYS = 90;
const DEFAULT_LEAD_DAYS = 2;

export type StoreSpace = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  locationLabel: string | null;
  pagePath: string | null;
  width: number;
  height: number;
  mobileWidth: number | null;
  mobileHeight: number | null;
  creativeSpecs: string | null;
  monthlyPriceCents: number;
  minDays: number;
  maxDays: number;
  leadDays: number;
  capacity: number;
  autoApprove: boolean;
  occupancy: DayOccupancy[];
  nextFreeStart: string | null;
};

type PlacementRow = {
  id: string; key: string; name: string; description: string | null; location_label: string | null; page_path: string | null;
  width: number; height: number; mobile_width: number | null; mobile_height: number | null; creative_specs: string | null;
  monthly_price_cents: number; min_days: number; max_days: number; creative_deadline_days: number | null;
  max_concurrent: number; auto_approve: boolean;
};

/** Reservas que seguram vaga: aprovadas ou ainda em análise (evita vender o mesmo espaço duas vezes). */
export async function getHoldingBookings(placementIds: string[], from: string, to: string): Promise<Map<string, Booking[]>> {
  const result = new Map<string, Booking[]>(placementIds.map((id) => [id, []]));
  if (placementIds.length === 0) return result;
  const { data, error } = await createServiceClient()
    .from("ad_campaigns")
    .select("placement_id, starts_at, ends_at")
    .in("placement_id", placementIds)
    .in("status", ["pending_review", "approved"])
    .lte("starts_at", to)
    .gte("ends_at", from);
  if (error) throw error;
  for (const row of data ?? []) result.get(row.placement_id)?.push({ startsAt: row.starts_at, endsAt: row.ends_at });
  return result;
}

export async function getStoreSpaces(): Promise<StoreSpace[]> {
  const today = new Date().toISOString().slice(0, 10);
  const horizon = addDays(today, STORE_HORIZON_DAYS);
  const { data, error } = await createServiceClient()
    .from("ad_placements")
    .select("id, key, name, description, location_label, page_path, width, height, mobile_width, mobile_height, creative_specs, monthly_price_cents, min_days, max_days, creative_deadline_days, max_concurrent, auto_approve")
    .eq("sellable", true)
    .eq("active", true)
    .not("monthly_price_cents", "is", null)
    .order("monthly_price_cents", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as unknown as PlacementRow[];
  const bookings = await getHoldingBookings(rows.map((row) => row.id), today, horizon);

  return rows.map((row) => {
    const held = bookings.get(row.id) ?? [];
    const leadDays = row.creative_deadline_days ?? DEFAULT_LEAD_DAYS;
    return {
      id: row.id,
      key: row.key,
      name: row.name,
      description: row.description,
      locationLabel: row.location_label,
      pagePath: row.page_path,
      width: row.width,
      height: row.height,
      mobileWidth: row.mobile_width,
      mobileHeight: row.mobile_height,
      creativeSpecs: row.creative_specs,
      monthlyPriceCents: row.monthly_price_cents,
      minDays: row.min_days,
      maxDays: row.max_days,
      leadDays,
      capacity: row.max_concurrent,
      autoApprove: row.auto_approve,
      occupancy: occupancyByDay(held, row.max_concurrent, today, STORE_HORIZON_DAYS),
      nextFreeStart: firstAvailableStart(held, row.max_concurrent, addDays(today, leadDays), row.min_days),
    };
  });
}

export type MyCampaign = {
  id: string;
  title: string;
  placementName: string;
  startsAt: string;
  endsAt: string;
  status: string;
  paymentStatus: string;
  priceCents: number | null;
  rejectionReason: string | null;
  metrics: CampaignMetrics;
};

export async function getMyCampaigns(businessId: string): Promise<MyCampaign[]> {
  const { data, error } = await createServiceClient()
    .from("ad_campaigns")
    .select("id, title, starts_at, ends_at, status, payment_status, price_cents, rejection_reason, ad_placements(name)")
    .eq("business_id", businessId)
    .order("starts_at", { ascending: false });
  if (error) throw error;
  return Promise.all(
    (data ?? []).map(async (row) => ({
      id: row.id,
      title: row.title,
      placementName: (row.ad_placements as unknown as { name: string } | null)?.name ?? "—",
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      status: row.status,
      paymentStatus: row.payment_status,
      priceCents: row.price_cents,
      rejectionReason: row.rejection_reason,
      metrics: await getCampaignMetrics(row.id),
    })),
  );
}
