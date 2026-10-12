"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guards";
import { logAdminAction } from "@/lib/audit-log";

type Result = { success: true } | { success: false; error: string };

const ROLES = ["super_admin", "admin", "comercial", "marketing"] as const;

async function setBookingStatus(
  bookingId: string,
  status: "aprovado" | "correcao" | "publicado" | "cancelado",
  contentStatus: string,
  correctionNote?: string,
): Promise<Result> {
  const adminId = await requireAdmin([...ROLES]);
  const supabase = createServiceClient();
  const update: Record<string, unknown> = { status, correction_note: correctionNote ?? null };
  if (status === "publicado") update.published_at = new Date().toISOString();
  const { data, error } = await supabase.from("publication_bookings").update(update).eq("id", bookingId).select("content_item_id").maybeSingle();
  if (error || !data) return { success: false, error: "Não foi possível atualizar a publicação." };
  if (data.content_item_id) {
    await supabase
      .from("content_items")
      .update({ status: contentStatus, ...(status === "publicado" ? { published_at: new Date().toISOString() } : {}) })
      .eq("id", data.content_item_id);
  }
  await logAdminAction(adminId, `publication_${status}`, "publication_booking", bookingId);
  revalidatePath("/admin/publicidade/publicacoes");
  return { success: true };
}

/** Aprova o conteúdo: daqui em diante a publicação fica agendada para a data marcada. */
export async function approvePublication(bookingId: string): Promise<Result> {
  return setBookingStatus(bookingId, "aprovado", "agendado");
}

export async function requestPublicationCorrection(bookingId: string, note: string): Promise<Result> {
  if (!note.trim()) return { success: false, error: "Explique o que precisa ser ajustado." };
  return setBookingStatus(bookingId, "correcao", "em_producao", note.trim());
}

export async function markPublicationPublished(bookingId: string): Promise<Result> {
  return setBookingStatus(bookingId, "publicado", "publicado");
}

export async function confirmPublicationPayment(bookingId: string, status: "pago" | "isento"): Promise<Result> {
  const adminId = await requireAdmin(["super_admin", "admin", "comercial", "financeiro"]);
  const { data, error } = await createServiceClient()
    .from("publication_bookings")
    .update({ payment_status: status })
    .eq("id", bookingId)
    .eq("payment_status", "pendente")
    .select("id")
    .maybeSingle();
  if (error || !data) return { success: false, error: "Não foi possível confirmar o pagamento." };
  await logAdminAction(adminId, `publication_payment_${status}`, "publication_booking", bookingId);
  revalidatePath("/admin/publicidade/publicacoes");
  return { success: true };
}

/** Preço, capacidade e disponibilidade de um produto de publicação (editável sem deploy). */
export async function updatePublicationProduct(
  productId: string,
  input: { priceCents: number; capacityPerSlot: number; active: boolean },
): Promise<Result> {
  const adminId = await requireAdmin(["super_admin", "admin", "comercial"]);
  if (!Number.isInteger(input.priceCents) || input.priceCents < 0 || !Number.isInteger(input.capacityPerSlot) || input.capacityPerSlot < 1) {
    return { success: false, error: "Valores inválidos." };
  }
  const { error } = await createServiceClient()
    .from("publication_products")
    .update({ price_cents: input.priceCents, capacity_per_slot: input.capacityPerSlot, active: input.active })
    .eq("id", productId);
  if (error) return { success: false, error: "Não foi possível salvar." };
  await logAdminAction(adminId, "publication_product_updated", "publication_product", productId);
  revalidatePath("/admin/publicidade/publicacoes");
  return { success: true };
}
