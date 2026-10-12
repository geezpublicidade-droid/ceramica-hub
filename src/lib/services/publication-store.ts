import { createServiceClient } from "@/lib/supabase/server";
import { addDays } from "@/lib/ad-schedule";
import { monthBounds, openSlots, type PublicationBookingRef, type PublicationRules, type PublicationSlot } from "@/lib/publication-schedule";
import { PUBLICATION_ALLOWANCE, remainingAllowance } from "@/lib/ad-plan-benefits";

export const PUBLICATION_HORIZON_DAYS = 60;

export type PublicationProduct = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  contentKind: string;
  channel: string;
  priceCents: number;
  rules: PublicationRules;
  imageWidth: number | null;
  imageHeight: number | null;
  creativeSpecs: string | null;
};

type ProductRow = {
  id: string; key: string; name: string; description: string | null; content_kind: string; channel: string; price_cents: number;
  time_slots: string[]; weekdays: number[]; capacity_per_slot: number; lead_days: number;
  image_width: number | null; image_height: number | null; creative_specs: string | null;
};

const PRODUCT_COLUMNS =
  "id, key, name, description, content_kind, channel, price_cents, time_slots, weekdays, capacity_per_slot, lead_days, image_width, image_height, creative_specs";

function mapProduct(row: ProductRow): PublicationProduct {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    contentKind: row.content_kind,
    channel: row.channel,
    priceCents: row.price_cents,
    rules: { timeSlots: row.time_slots ?? [], weekdays: row.weekdays ?? [], capacityPerSlot: row.capacity_per_slot, leadDays: row.lead_days },
    imageWidth: row.image_width,
    imageHeight: row.image_height,
    creativeSpecs: row.creative_specs,
  };
}

export async function getPublicationProduct(productId: string): Promise<PublicationProduct | null> {
  const { data } = await createServiceClient()
    .from("publication_products")
    .select(PRODUCT_COLUMNS)
    .eq("id", productId)
    .eq("sellable", true)
    .eq("active", true)
    .maybeSingle();
  return data ? mapProduct(data as unknown as ProductRow) : null;
}

/** Reservas que seguram horário (todas, menos canceladas) de um produto a partir de `from`. */
export async function getPublicationBookingRefs(productId: string, from: string, to: string): Promise<PublicationBookingRef[]> {
  const { data, error } = await createServiceClient()
    .from("publication_bookings")
    .select("scheduled_for, time_slot")
    .eq("product_id", productId)
    .neq("status", "cancelado")
    .gte("scheduled_for", from)
    .lte("scheduled_for", to);
  if (error) throw error;
  return (data ?? []).map((row) => ({ scheduledFor: row.scheduled_for, timeSlot: row.time_slot }));
}

export type PublicationOffer = { product: PublicationProduct; slots: PublicationSlot[]; includedLeft: number };

/** Quantas publicações do produto a empresa já usou do benefício no mês da data. */
export async function countAllowanceUsed(businessId: string, productId: string, date: string): Promise<number> {
  const { from, to } = monthBounds(date);
  const { count } = await createServiceClient()
    .from("publication_bookings")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("product_id", productId)
    .eq("payment_status", "incluido")
    .neq("status", "cancelado")
    .gte("scheduled_for", from)
    .lt("scheduled_for", to);
  return count ?? 0;
}

export async function getPublicationOffers(businessId: string, plan: string): Promise<PublicationOffer[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("publication_products").select(PRODUCT_COLUMNS).eq("sellable", true).eq("active", true).order("sort_order");
  if (error) throw error;
  const today = new Date().toISOString().slice(0, 10);
  const horizon = addDays(today, PUBLICATION_HORIZON_DAYS);
  return Promise.all(
    ((data ?? []) as unknown as ProductRow[]).map(async (row) => {
      const product = mapProduct(row);
      const refs = await getPublicationBookingRefs(product.id, today, horizon);
      const hasAllowance = PUBLICATION_ALLOWANCE[product.key]?.[plan] !== undefined;
      const used = hasAllowance ? await countAllowanceUsed(businessId, product.id, today) : 0;
      return { product, slots: openSlots(product.rules, refs, today, PUBLICATION_HORIZON_DAYS), includedLeft: remainingAllowance(plan, product.key, used) };
    }),
  );
}

export type MyPublication = {
  id: string;
  productName: string;
  title: string;
  scheduledFor: string;
  timeSlot: string;
  status: string;
  paymentStatus: string;
  priceCents: number;
  correctionNote: string | null;
};

export async function getMyPublications(businessId: string): Promise<MyPublication[]> {
  const { data, error } = await createServiceClient()
    .from("publication_bookings")
    .select("id, title, scheduled_for, time_slot, status, payment_status, price_cents, correction_note, publication_products(name)")
    .eq("business_id", businessId)
    .order("scheduled_for", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    productName: (row.publication_products as unknown as { name: string } | null)?.name ?? "Publicação",
    title: row.title,
    scheduledFor: row.scheduled_for,
    timeSlot: row.time_slot,
    status: row.status,
    paymentStatus: row.payment_status,
    priceCents: row.price_cents,
    correctionNote: row.correction_note,
  }));
}
