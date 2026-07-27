"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guards";
import { logAdminAction } from "@/lib/audit-log";

type ActionResult = { success: true } | { success: false; error: string };
const STATUSES = ["draft", "active", "inactive"] as const;

const hotelSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  logoUrl: z.string().trim().url().optional().or(z.literal("")),
  coverPhotoUrl: z.string().trim().url().optional().or(z.literal("")),
  bookingLink: z.string().trim().url().optional().or(z.literal("")),
  whatsapp: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
});

export async function createHotel(rawInput: z.infer<typeof hotelSchema>): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin"]);
  const parsed = hotelSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = createServiceClient();
  const { data: hotel, error } = await supabase
    .from("hotels")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description || null,
      logo_url: parsed.data.logoUrl || null,
      cover_photo_url: parsed.data.coverPhotoUrl || null,
      booking_link: parsed.data.bookingLink || null,
      whatsapp: parsed.data.whatsapp || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
    })
    .select("id")
    .single();
  if (error || !hotel) return { success: false, error: "Não foi possível criar o hotel." };

  await logAdminAction(adminId, "create_hotel", "hotel", hotel.id, { name: parsed.data.name });
  revalidatePath("/admin/hoteis");
  return { success: true };
}

export async function updateHotelStatus(hotelId: string, status: (typeof STATUSES)[number]): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin"]);
  const supabase = createServiceClient();
  const { error } = await supabase.from("hotels").update({ status, updated_at: new Date().toISOString() }).eq("id", hotelId);
  if (error) return { success: false, error: "Não foi possível atualizar o status." };

  await logAdminAction(adminId, "update_hotel_status", "hotel", hotelId, { status });
  revalidatePath("/admin/hoteis");
  revalidatePath("/business-travel");
  return { success: true };
}

export async function deleteHotel(hotelId: string): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin"]);
  const supabase = createServiceClient();
  const { error } = await supabase.from("hotels").delete().eq("id", hotelId);
  if (error) return { success: false, error: "Não foi possível excluir." };

  await logAdminAction(adminId, "delete_hotel", "hotel", hotelId, {});
  revalidatePath("/admin/hoteis");
  return { success: true };
}
