import { createServiceClient } from "@/lib/supabase/server";

export type RealEstateListing = {
  id: string;
  title: string;
  description: string | null;
  listingType: "venda" | "locacao";
  spaceType: "laje_inteira" | "sala_comercial";
  areaM2: number | null;
  priceCents: number | null;
  towerName: string | null;
  floor: string | null;
  roomNumber: string | null;
  availabilityStatus: "disponivel" | "indisponivel" | "sob_consulta";
  agencyName: string | null;
  contactWhatsapp: string | null;
  contactLink: string | null;
  photoUrl: string | null;
  status: "draft" | "active" | "inactive";
};

function mapListing(row: Record<string, unknown>): RealEstateListing {
  const tower = row.towers as { name: string } | null;
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string | null,
    listingType: row.listing_type as RealEstateListing["listingType"],
    spaceType: row.space_type as RealEstateListing["spaceType"],
    areaM2: row.area_m2 as number | null,
    priceCents: row.price_cents as number | null,
    towerName: tower?.name ?? null,
    floor: row.floor as string | null,
    roomNumber: row.room_number as string | null,
    availabilityStatus: row.availability_status as RealEstateListing["availabilityStatus"],
    agencyName: row.agency_name as string | null,
    contactWhatsapp: row.contact_whatsapp as string | null,
    contactLink: row.contact_link as string | null,
    photoUrl: row.photo_url as string | null,
    status: row.status as RealEstateListing["status"],
  };
}

export async function getActiveListings(): Promise<RealEstateListing[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("real_estate_listings")
    .select("*, towers(name)")
    .eq("status", "active")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapListing);
}

export async function getAllListingsForAdmin(): Promise<RealEstateListing[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("real_estate_listings")
    .select("*, towers(name)")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapListing);
}
