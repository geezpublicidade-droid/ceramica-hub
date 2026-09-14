"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guards";
import { logAdminAction } from "@/lib/audit-log";

type ActionResult = { success: true } | { success: false; error: string };
const STATUSES = ["draft", "active", "inactive"] as const;
const EVENT_TYPES = ["forum_negocios", "workshop", "networking", "outro"] as const;

const eventSchema = z.object({
  title: z.string().trim().min(1, "Informe o título."),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  eventType: z.enum(EVENT_TYPES),
  startsAt: z.string().trim().min(1, "Informe a data e hora de início."),
  endsAt: z.string().trim().optional().or(z.literal("")),
  location: z.string().trim().optional().or(z.literal("")),
  coverPhotoUrl: z.string().trim().url().optional().or(z.literal("")),
  registrationLink: z.string().trim().url().optional().or(z.literal("")),
  whatsapp: z.string().trim().optional().or(z.literal("")),
  capacity: z.string().trim().optional().or(z.literal("")),
});

export async function createEvent(rawInput: z.infer<typeof eventSchema>): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin"]);
  const parsed = eventSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const capacity = parsed.data.capacity ? Number.parseInt(parsed.data.capacity, 10) : null;
  const supabase = createServiceClient();
  const { data: event, error } = await supabase
    .from("business_events")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description || null,
      event_type: parsed.data.eventType,
      starts_at: new Date(parsed.data.startsAt).toISOString(),
      ends_at: parsed.data.endsAt ? new Date(parsed.data.endsAt).toISOString() : null,
      location: parsed.data.location || null,
      cover_photo_url: parsed.data.coverPhotoUrl || null,
      registration_link: parsed.data.registrationLink || null,
      whatsapp: parsed.data.whatsapp || null,
      capacity: Number.isFinite(capacity) ? capacity : null,
    })
    .select("id")
    .single();
  if (error || !event) return { success: false, error: "Não foi possível criar o evento." };

  await logAdminAction(adminId, "create_event", "business_event", event.id, { title: parsed.data.title });
  revalidatePath("/admin/eventos");
  return { success: true };
}

export async function updateEventStatus(eventId: string, status: (typeof STATUSES)[number]): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin"]);
  const supabase = createServiceClient();
  const { error } = await supabase.from("business_events").update({ status, updated_at: new Date().toISOString() }).eq("id", eventId);
  if (error) return { success: false, error: "Não foi possível atualizar o status." };

  await logAdminAction(adminId, "update_event_status", "business_event", eventId, { status });
  revalidatePath("/admin/eventos");
  revalidatePath("/forum-de-negocios");
  return { success: true };
}

export async function deleteEvent(eventId: string): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin"]);
  const supabase = createServiceClient();
  const { error } = await supabase.from("business_events").delete().eq("id", eventId);
  if (error) return { success: false, error: "Não foi possível excluir." };

  await logAdminAction(adminId, "delete_event", "business_event", eventId, {});
  revalidatePath("/admin/eventos");
  revalidatePath("/forum-de-negocios");
  return { success: true };
}
