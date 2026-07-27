"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guards";
import { logAdminAction } from "@/lib/audit-log";

type ActionResult = { success: true } | { success: false; error: string };
const STATUSES = ["draft", "active", "inactive"] as const;

const spaceSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  spaceType: z.enum(["auditorio", "sala_reuniao"]),
  capacity: z.number().int().positive().nullable(),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  photoUrl: z.string().trim().url().optional().or(z.literal("")),
  equipment: z.string().trim().optional().or(z.literal("")),
  towerId: z.string().trim().optional().or(z.literal("")),
  floor: z.string().trim().optional().or(z.literal("")),
  roomNumber: z.string().trim().optional().or(z.literal("")),
  pricingInfo: z.string().trim().optional().or(z.literal("")),
  contactWhatsapp: z.string().trim().optional().or(z.literal("")),
  contactLink: z.string().trim().url().optional().or(z.literal("")),
  rules: z.string().trim().optional().or(z.literal("")),
});

export async function createMeetingSpace(rawInput: z.infer<typeof spaceSchema>): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin"]);
  const parsed = spaceSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = createServiceClient();
  const { data: space, error } = await supabase
    .from("meeting_spaces")
    .insert({
      name: parsed.data.name,
      space_type: parsed.data.spaceType,
      capacity: parsed.data.capacity,
      description: parsed.data.description || null,
      photo_url: parsed.data.photoUrl || null,
      equipment: parsed.data.equipment || null,
      tower_id: parsed.data.towerId || null,
      floor: parsed.data.floor || null,
      room_number: parsed.data.roomNumber || null,
      pricing_info: parsed.data.pricingInfo || null,
      contact_whatsapp: parsed.data.contactWhatsapp || null,
      contact_link: parsed.data.contactLink || null,
      rules: parsed.data.rules || null,
    })
    .select("id")
    .single();
  if (error || !space) return { success: false, error: "Não foi possível criar o espaço." };

  await logAdminAction(adminId, "create_meeting_space", "meeting_space", space.id, { name: parsed.data.name });
  revalidatePath("/admin/auditorios");
  return { success: true };
}

export async function updateMeetingSpaceStatus(spaceId: string, status: (typeof STATUSES)[number]): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin"]);
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("meeting_spaces")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", spaceId);
  if (error) return { success: false, error: "Não foi possível atualizar o status." };

  await logAdminAction(adminId, "update_meeting_space_status", "meeting_space", spaceId, { status });
  revalidatePath("/admin/auditorios");
  revalidatePath("/auditorios-reunioes");
  return { success: true };
}

export async function deleteMeetingSpace(spaceId: string): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin"]);
  const supabase = createServiceClient();
  const { error } = await supabase.from("meeting_spaces").delete().eq("id", spaceId);
  if (error) return { success: false, error: "Não foi possível excluir." };

  await logAdminAction(adminId, "delete_meeting_space", "meeting_space", spaceId, {});
  revalidatePath("/admin/auditorios");
  return { success: true };
}
