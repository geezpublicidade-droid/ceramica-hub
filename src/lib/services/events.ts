import { createServiceClient } from "@/lib/supabase/server";

export type BusinessEvent = {
  id: string;
  title: string;
  description: string | null;
  eventType: "forum_negocios" | "workshop" | "networking" | "outro";
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  coverPhotoUrl: string | null;
  registrationLink: string | null;
  whatsapp: string | null;
  capacity: number | null;
  status: "draft" | "active" | "inactive";
};

function mapEvent(row: Record<string, unknown>): BusinessEvent {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string | null,
    eventType: row.event_type as BusinessEvent["eventType"],
    startsAt: row.starts_at as string,
    endsAt: row.ends_at as string | null,
    location: row.location as string | null,
    coverPhotoUrl: row.cover_photo_url as string | null,
    registrationLink: row.registration_link as string | null,
    whatsapp: row.whatsapp as string | null,
    capacity: row.capacity as number | null,
    status: row.status as BusinessEvent["status"],
  };
}

/** Só eventos publicados que ainda não terminaram (ends_at, ou starts_at quando não há hora de término). */
export async function getUpcomingEvents(): Promise<BusinessEvent[]> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("business_events")
    .select("*")
    .eq("status", "active")
    .or(`ends_at.gte.${now},and(ends_at.is.null,starts_at.gte.${now})`)
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapEvent);
}

export async function getAllEventsForAdmin(): Promise<BusinessEvent[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("business_events").select("*").order("starts_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapEvent);
}
