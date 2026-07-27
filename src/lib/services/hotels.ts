import { createServiceClient } from "@/lib/supabase/server";

export type Hotel = {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  coverPhotoUrl: string | null;
  bookingLink: string | null;
  whatsapp: string | null;
  phone: string | null;
  address: string | null;
  status: "draft" | "active" | "inactive";
};

function mapHotel(row: Record<string, unknown>): Hotel {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | null,
    logoUrl: row.logo_url as string | null,
    coverPhotoUrl: row.cover_photo_url as string | null,
    bookingLink: row.booking_link as string | null,
    whatsapp: row.whatsapp as string | null,
    phone: row.phone as string | null,
    address: row.address as string | null,
    status: row.status as Hotel["status"],
  };
}

export async function getActiveHotels(): Promise<Hotel[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("hotels").select("*").eq("status", "active").order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapHotel);
}

export async function getAllHotelsForAdmin(): Promise<Hotel[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("hotels").select("*").order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapHotel);
}
