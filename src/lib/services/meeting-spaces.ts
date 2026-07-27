import { createServiceClient } from "@/lib/supabase/server";

export type MeetingSpace = {
  id: string;
  name: string;
  spaceType: "auditorio" | "sala_reuniao";
  capacity: number | null;
  description: string | null;
  photoUrl: string | null;
  equipment: string | null;
  towerName: string | null;
  floor: string | null;
  roomNumber: string | null;
  pricingInfo: string | null;
  contactWhatsapp: string | null;
  contactLink: string | null;
  rules: string | null;
  status: "draft" | "active" | "inactive";
};

function mapSpace(row: Record<string, unknown>): MeetingSpace {
  const tower = row.towers as { name: string } | null;
  return {
    id: row.id as string,
    name: row.name as string,
    spaceType: row.space_type as MeetingSpace["spaceType"],
    capacity: row.capacity as number | null,
    description: row.description as string | null,
    photoUrl: row.photo_url as string | null,
    equipment: row.equipment as string | null,
    towerName: tower?.name ?? null,
    floor: row.floor as string | null,
    roomNumber: row.room_number as string | null,
    pricingInfo: row.pricing_info as string | null,
    contactWhatsapp: row.contact_whatsapp as string | null,
    contactLink: row.contact_link as string | null,
    rules: row.rules as string | null,
    status: row.status as MeetingSpace["status"],
  };
}

export async function getActiveMeetingSpaces(): Promise<MeetingSpace[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("meeting_spaces")
    .select("*, towers(name)")
    .eq("status", "active")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapSpace);
}

export async function getAllMeetingSpacesForAdmin(): Promise<MeetingSpace[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("meeting_spaces")
    .select("*, towers(name)")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapSpace);
}
