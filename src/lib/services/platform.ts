import { createServiceClient } from "@/lib/supabase/server";
import { categories, type Business } from "@/data/businesses";
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
  name: string;
  category: string;
  description: string | null;
  instagram: string | null;
  phone: string;
  floor: string;
  room_number: string;
  logo_url: string | null;
  plan: "free" | "destaque";
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
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description ?? "",
    instagram: row.instagram ?? "",
    phone: row.phone,
    floor: `${row.towers?.name ?? "Torre não informada"} · ${row.floor} · sala ${row.room_number}`,
    verified: row.status === "approved",
    initials: initialsFrom(row.name),
    plan: row.plan,
    status: row.status,
    logo: row.logo_url ?? undefined,
  };
}

/**
 * Camada de serviço da plataforma. Consulta o Supabase com a service role
 * key (server-only) — nunca importar este arquivo de um componente
 * "use client". `getBusinessById` não filtra por status de propósito: é
 * usado tanto pela página pública (`empresa/[id]`, que checa o status ela
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getBusinessById(id: string): Promise<Business | undefined> {
  if (!UUID_RE.test(id)) return undefined;

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("businesses").select(BUSINESS_SELECT).eq("id", id).maybeSingle();
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
    .select(`id, kind, title, description, business_id, businesses!inner(${BUSINESS_SELECT})`)
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
      business,
    };
  });
}
