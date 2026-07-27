"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guards";
import { logAdminAction } from "@/lib/audit-log";

type ActionResult = { success: true } | { success: false; error: string };
const STATUSES = ["draft", "active", "inactive"] as const;

const listingSchema = z.object({
  title: z.string().trim().min(1, "Informe o título."),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  listingType: z.enum(["venda", "locacao"]),
  spaceType: z.enum(["laje_inteira", "sala_comercial"]),
  areaM2: z.number().positive().nullable(),
  priceCents: z.number().int().nonnegative().nullable(),
  towerId: z.string().trim().optional().or(z.literal("")),
  floor: z.string().trim().optional().or(z.literal("")),
  roomNumber: z.string().trim().optional().or(z.literal("")),
  availabilityStatus: z.enum(["disponivel", "indisponivel", "sob_consulta"]),
  agencyName: z.string().trim().optional().or(z.literal("")),
  contactWhatsapp: z.string().trim().optional().or(z.literal("")),
  contactLink: z.string().trim().url().optional().or(z.literal("")),
  photoUrl: z.string().trim().url().optional().or(z.literal("")),
});

export async function createListing(rawInput: z.infer<typeof listingSchema>): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin"]);
  const parsed = listingSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = createServiceClient();
  const { data: listing, error } = await supabase
    .from("real_estate_listings")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description || null,
      listing_type: parsed.data.listingType,
      space_type: parsed.data.spaceType,
      area_m2: parsed.data.areaM2,
      price_cents: parsed.data.priceCents,
      tower_id: parsed.data.towerId || null,
      floor: parsed.data.floor || null,
      room_number: parsed.data.roomNumber || null,
      availability_status: parsed.data.availabilityStatus,
      agency_name: parsed.data.agencyName || null,
      contact_whatsapp: parsed.data.contactWhatsapp || null,
      contact_link: parsed.data.contactLink || null,
      photo_url: parsed.data.photoUrl || null,
    })
    .select("id")
    .single();
  if (error || !listing) return { success: false, error: "Não foi possível criar o anúncio." };

  await logAdminAction(adminId, "create_real_estate_listing", "real_estate_listing", listing.id, { title: parsed.data.title });
  revalidatePath("/admin/imobiliarias");
  return { success: true };
}

export async function updateListingStatus(listingId: string, status: (typeof STATUSES)[number]): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin"]);
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("real_estate_listings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", listingId);
  if (error) return { success: false, error: "Não foi possível atualizar o status." };

  await logAdminAction(adminId, "update_real_estate_listing_status", "real_estate_listing", listingId, { status });
  revalidatePath("/admin/imobiliarias");
  revalidatePath("/imobiliarias");
  return { success: true };
}

export async function deleteListing(listingId: string): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin"]);
  const supabase = createServiceClient();
  const { error } = await supabase.from("real_estate_listings").delete().eq("id", listingId);
  if (error) return { success: false, error: "Não foi possível excluir." };

  await logAdminAction(adminId, "delete_real_estate_listing", "real_estate_listing", listingId, {});
  revalidatePath("/admin/imobiliarias");
  return { success: true };
}
