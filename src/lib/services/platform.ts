import { createServiceClient } from "@/lib/supabase/server";
import { categories, type Business, type BusinessService, type VirtualVisitType } from "@/data/businesses";
import { type Opportunity } from "@/data/opportunities";
import { type Benefit } from "@/data/benefits";

export type PlatformStats = {
  businesses: number;
  categories: number;
  floors: number;
};

export type CategoryBreakdown = {
  category: string;
  count: number;
};

type TowerJoin = { name: string } | null;

type BusinessRow = {
  id: string;
  slug: string | null;
  name: string;
  category: string;
  description: string | null;
  instagram: string | null;
  phone: string;
  floor: string;
  room_number: string;
  logo_url: string | null;
  cover_photo_url: string | null;
  website_url: string | null;
  booking_url: string | null;
  opening_hours: string | null;
  video_url: string | null;
  image_usage_authorized: boolean;
  has_virtual_visit: boolean;
  virtual_visit_type: VirtualVisitType | null;
  virtual_visit_url: string | null;
  virtual_visit_provider: string | null;
  virtual_visit_thumbnail: string | null;
  virtual_visit_description: string | null;
  virtual_visit_active: boolean;
  address_verified: boolean;
  photographed: boolean;
  founder: boolean;
  plan: "presenca" | "destaque" | "experiencia";
  status: "pending" | "approved" | "rejected";
  towers: TowerJoin;
};

const BUSINESS_SELECT = "*, towers(name)";

const INITIALS_STOPWORDS = new Set(["da", "de", "do", "das", "dos", "e"]);

function initialsFrom(name: string): string {
  const words = name
    .split(/\s+/)
    .filter((word) => /\p{L}/u.test(word) && word.length > 1 && !INITIALS_STOPWORDS.has(word.toLowerCase()));
  const initials = words
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
  return initials || name.slice(0, 2).toUpperCase();
}

function mapBusiness(row: BusinessRow): Business {
  const verified = row.status === "approved";
  return {
    id: row.id,
    slug: row.slug ?? row.id,
    name: row.name,
    category: row.category,
    description: row.description ?? "",
    instagram: row.instagram ?? "",
    phone: row.phone,
    floor: `${row.towers?.name ?? "Torre não informada"} · ${row.floor} · sala ${row.room_number}`,
    verified,
    initials: initialsFrom(row.name),
    plan: row.plan,
    status: row.status,
    logo: row.logo_url ?? undefined,
    coverPhoto: row.cover_photo_url ?? undefined,
    websiteUrl: row.website_url ?? undefined,
    bookingUrl: row.booking_url ?? undefined,
    openingHours: row.opening_hours ?? undefined,
    videoUrl: row.video_url ?? undefined,
    imageUsageAuthorized: row.image_usage_authorized,
    virtualVisit: {
      active: row.virtual_visit_active,
      type: row.virtual_visit_type,
      url: row.virtual_visit_url,
      provider: row.virtual_visit_provider,
      thumbnail: row.virtual_visit_thumbnail,
      description: row.virtual_visit_description,
    },
    seals: {
      verified,
      addressVerified: row.address_verified,
      photographed: row.photographed,
      virtualVisitAvailable: row.virtual_visit_active,
      founder: row.founder,
    },
  };
}

/**
 * Camada de serviço da plataforma. Consulta o Supabase com a service role
 * key (server-only) — nunca importar este arquivo de um componente
 * "use client". `getBusinessById` não filtra por status de propósito: é
 * usado tanto pela página pública (`empresa/[slug]`, que checa o status ela
 * mesma) quanto pelo dashboard da própria empresa (que precisa ver o
 * próprio perfil mesmo enquanto `pending`).
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("category, floor")
    .eq("status", "approved");
  if (error) throw error;

  const rows = data ?? [];
  const realCategories = categories.filter((category) => category !== "Todas");

  return {
    businesses: rows.length,
    categories: realCategories.length,
    floors: new Set(rows.map((row) => row.floor)).size,
  };
}

export async function getCategoryBreakdown(): Promise<CategoryBreakdown[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("businesses").select("category").eq("status", "approved");
  if (error) throw error;

  const rows = data ?? [];
  const realCategories = categories.filter((category) => category !== "Todas");

  return realCategories.map((category) => ({
    category,
    count: rows.filter((row) => row.category === category).length,
  }));
}

export async function getFeaturedBusinesses(limit?: number): Promise<Business[]> {
  const supabase = createServiceClient();
  let query = supabase.from("businesses").select(BUSINESS_SELECT).eq("status", "approved");
  if (typeof limit === "number") query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;

  return ((data ?? []) as BusinessRow[]).map(mapBusiness);
}

export async function getAllBusinesses(): Promise<Business[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("businesses").select(BUSINESS_SELECT).eq("status", "approved");
  if (error) throw error;

  return ((data ?? []) as BusinessRow[]).map(mapBusiness);
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getBusinessById(id: string): Promise<Business | undefined> {
  if (!UUID_RE.test(id)) return undefined;

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("businesses").select(BUSINESS_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return undefined;

  return mapBusiness(data as BusinessRow);
}

export async function getBusinessBySlug(slug: string): Promise<Business | undefined> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("businesses").select(BUSINESS_SELECT).eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!data) return undefined;

  return mapBusiness(data as BusinessRow);
}

export async function getRelatedBusinesses(business: Business, limit = 3): Promise<Business[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("businesses")
    .select(BUSINESS_SELECT)
    .eq("status", "approved")
    .eq("category", business.category)
    .neq("id", business.id)
    .limit(limit);
  if (error) throw error;

  return ((data ?? []) as BusinessRow[]).map(mapBusiness);
}

export type OpportunityWithBusiness = Opportunity & { business: Business };

export async function getOpportunities(): Promise<OpportunityWithBusiness[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select(`id, type, title, description, business_id, businesses!inner(${BUSINESS_SELECT})`)
    .eq("active", true)
    .eq("businesses.status", "approved");
  if (error) throw error;

  return (data ?? []).map((row) => {
    const business = mapBusiness(row.businesses as unknown as BusinessRow);
    return {
      id: row.id,
      businessId: row.business_id,
      type: row.type,
      title: row.title,
      description: row.description ?? "",
      business,
    };
  });
}

export type BenefitWithBusiness = Benefit & { business: Business };

export async function getBenefits(): Promise<BenefitWithBusiness[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("benefits")
    .select(`id, kind, title, description, valid_until, coupon_code, business_id, businesses!inner(${BUSINESS_SELECT})`)
    .eq("active", true)
    .eq("businesses.status", "approved");
  if (error) throw error;

  return (data ?? []).map((row) => {
    const business = mapBusiness(row.businesses as unknown as BusinessRow);
    return {
      id: row.id,
      businessId: row.business_id,
      kind: row.kind,
      title: row.title,
      description: row.description ?? "",
      validUntil: row.valid_until ?? undefined,
      couponCode: row.coupon_code ?? undefined,
      business,
    };
  });
}

export async function getBusinessServices(businessId: string): Promise<BusinessService[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("business_services")
    .select("*")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    description: row.description,
    photo: row.photo_url,
    startingPrice: row.starting_price,
    sortOrder: row.sort_order,
  }));
}

export type PlatformSettings = {
  geezDiscountEnabled: boolean;
  geezDiscountMaxPercentage: number;
  geezDiscountTerms: string | null;
  geezMonthlySlotsLimit: number | null;
  siteCreditEnabled: boolean;
  siteCreditPercentage: number;
  siteCreditMonthLimit: number | null;
  siteCreditMaximum: number | null;
  siteCreditTerms: string | null;
};

/** Config global, uma linha só. Tudo desativado até o admin ligar — nunca aplicar automaticamente. */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("platform_settings").select("*").single();
  if (error) throw error;

  return {
    geezDiscountEnabled: data.geez_discount_enabled,
    geezDiscountMaxPercentage: data.geez_discount_max_percentage,
    geezDiscountTerms: data.geez_discount_terms,
    geezMonthlySlotsLimit: data.geez_monthly_slots_limit,
    siteCreditEnabled: data.site_credit_enabled,
    siteCreditPercentage: data.site_credit_percentage,
    siteCreditMonthLimit: data.site_credit_month_limit,
    siteCreditMaximum: data.site_credit_maximum,
    siteCreditTerms: data.site_credit_terms,
  };
}

export type MetricEventType =
  | "commercial_page_viewed"
  | "virtual_visit_opened"
  | "virtual_visit_completed"
  | "gallery_viewed"
  | "video_played"
  | "directions_clicked"
  | "appointment_clicked"
  | "whatsapp_clicked"
  | "coupon_redeemed"
  | "geez_service_clicked"
  | "geez_quote_requested"
  | "website_upgrade_clicked"
  | "search_performed";

/** Log de evento append-only. Nunca inventar número no painel: sem linha aqui, mostra 0/vazio. */
export async function logMetricEvent(
  eventType: MetricEventType,
  businessId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("metrics_events")
    .insert({ event_type: eventType, business_id: businessId ?? null, metadata: metadata ?? null });
  if (error) throw error;
}

export type MetricsSummary = Record<MetricEventType, number>;

export async function getMetricsSummary(businessId: string): Promise<MetricsSummary> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("metrics_events").select("event_type").eq("business_id", businessId);
  if (error) throw error;

  const summary = {} as MetricsSummary;
  for (const row of data ?? []) {
    const type = row.event_type as MetricEventType;
    summary[type] = (summary[type] ?? 0) + 1;
  }
  return summary;
}
