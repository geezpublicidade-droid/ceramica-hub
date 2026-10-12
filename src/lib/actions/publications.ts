"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireBusinessOwner } from "@/lib/auth-guards";
import { safeHref } from "@/lib/category-page";
import { checkCreativeSize, CREATIVE_TYPES, MAX_CREATIVE_BYTES } from "@/lib/ad-creative";
import { applyDiscount, discountFor, remainingAllowance } from "@/lib/ad-plan-benefits";
import { validatePublicationSlot } from "@/lib/publication-schedule";
import { addDays } from "@/lib/ad-schedule";
import { countAllowanceUsed, getPublicationBookingRefs, getPublicationProduct } from "@/lib/services/publication-store";
import { getCompanyPermissions } from "@/lib/services/company-plan";

type Result = { success: true; included?: boolean } | { success: false; error: string };
type UploadResult = { success: true; url: string } | { success: false; error: string };

/** Envia a arte da publicação, conferindo formato e proporção contra a medida do produto. */
export async function uploadPublicationImage(formData: FormData): Promise<UploadResult> {
  try {
    const businessId = await requireBusinessOwner();
    const product = await getPublicationProduct(String(formData.get("productId") ?? ""));
    const file = formData.get("file");
    if (!product) return { success: false, error: "Produto indisponível." };
    if (!(file instanceof File) || file.size === 0) return { success: false, error: "Selecione a imagem." };
    if (!CREATIVE_TYPES.includes(file.type)) return { success: false, error: "Use JPG, PNG ou WebP." };
    if (file.size > MAX_CREATIVE_BYTES) return { success: false, error: "Arquivo acima de 4MB." };

    const bytes = Buffer.from(await file.arrayBuffer());
    if (product.imageWidth && product.imageHeight) {
      const { default: sharp } = await import("sharp");
      const meta = await sharp(bytes).metadata();
      const problem = checkCreativeSize(meta.width ?? 0, meta.height ?? 0, { width: product.imageWidth, height: product.imageHeight });
      if (problem) return { success: false, error: problem };
    }
    const extension = file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${businessId}/publicacoes/${crypto.randomUUID()}.${extension}`;
    const supabase = createServiceClient();
    const { error } = await supabase.storage.from("business-photos").upload(path, bytes, { contentType: file.type, upsert: false });
    if (error) return { success: false, error: "Não foi possível enviar a imagem." };
    return { success: true, url: supabase.storage.from("business-photos").getPublicUrl(path).data.publicUrl };
  } catch {
    return { success: false, error: "Não foi possível enviar a imagem." };
  }
}

const bookingSchema = z.object({
  productId: z.string().uuid(),
  date: z.string(),
  time: z.string(),
  title: z.string().trim().min(3, "Dê um título à publicação.").max(100),
  body: z.string().trim().max(1000).optional(),
  linkUrl: z.string().trim().optional(),
  imageUrl: z.string().url().optional(),
});

/** Reserva data e horário de uma publicação. Usa o benefício do plano quando houver; senão fica aguardando pagamento. */
export async function bookPublication(raw: z.input<typeof bookingSchema>): Promise<Result> {
  try {
    const businessId = await requireBusinessOwner();
    const parsed = bookingSchema.safeParse(raw);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
    const input = parsed.data;

    const product = await getPublicationProduct(input.productId);
    if (!product) return { success: false, error: "Produto indisponível." };
    if (product.imageWidth && !input.imageUrl) return { success: false, error: "Envie a arte da publicação." };

    const link = input.linkUrl ? safeHref(input.linkUrl, "") : { href: "" };
    if (input.linkUrl && !link.href) return { success: false, error: "O link precisa começar com https:// ou ser uma página do site." };

    const today = new Date().toISOString().slice(0, 10);
    const refs = await getPublicationBookingRefs(product.id, input.date, addDays(input.date, 0));
    const slotError = validatePublicationSlot(product.rules, refs, today, input.date, input.time);
    if (slotError) return { success: false, error: slotError };

    const permissions = await getCompanyPermissions(businessId);
    const plan = permissions?.plan ?? "presenca";
    const used = await countAllowanceUsed(businessId, product.id, input.date);
    const included = remainingAllowance(plan, product.key, used) > 0;
    const priceCents = included ? 0 : applyDiscount(product.priceCents, discountFor(plan));
    const timeSlot = product.rules.timeSlots.length > 0 ? input.time : "";

    const supabase = createServiceClient();
    const { data: item } = await supabase
      .from("content_items")
      .insert({
        kind: product.contentKind,
        channel: product.channel,
        title: `${product.name}: ${input.title}`,
        briefing: input.body || null,
        body: [input.body, link.href, input.imageUrl].filter(Boolean).join("\n") || null,
        status: "aguardando_aprovacao",
        business_id: businessId,
        scheduled_for: input.date,
      })
      .select("id")
      .single();

    const { data: booking, error } = await supabase
      .from("publication_bookings")
      .insert({
        product_id: product.id,
        business_id: businessId,
        content_item_id: item?.id ?? null,
        scheduled_for: input.date,
        time_slot: timeSlot,
        title: input.title,
        body: input.body || null,
        image_url: input.imageUrl ?? null,
        link_url: link.href || null,
        price_cents: priceCents,
        payment_status: included ? "incluido" : "pendente",
      })
      .select("id")
      .single();
    if (error || !booking) {
      if (item?.id) await supabase.from("content_items").delete().eq("id", item.id);
      return { success: false, error: "Não foi possível criar a reserva." };
    }

    // Segunda conferência contra reservas simultâneas no mesmo horário.
    const after = await getPublicationBookingRefs(product.id, input.date, input.date);
    if (after.filter((b) => b.timeSlot === timeSlot).length > product.rules.capacityPerSlot) {
      await supabase.from("publication_bookings").delete().eq("id", booking.id);
      if (item?.id) await supabase.from("content_items").delete().eq("id", item.id);
      return { success: false, error: "Esse horário acabou de ser reservado. Escolha outro." };
    }

    revalidatePath("/dashboard/anuncios");
    revalidatePath("/dashboard/agenda");
    return { success: true, included };
  } catch {
    return { success: false, error: "Não foi possível concluir a reserva. Tente de novo." };
  }
}

/** Cancela uma publicação ainda não aprovada/publicada. */
export async function cancelMyPublication(bookingId: string): Promise<Result> {
  try {
    const businessId = await requireBusinessOwner();
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("publication_bookings")
      .update({ status: "cancelado" })
      .eq("id", bookingId)
      .eq("business_id", businessId)
      .in("status", ["aguardando", "correcao"])
      .select("content_item_id");
    if (error || !data?.length) return { success: false, error: "Só é possível cancelar publicações ainda não aprovadas." };
    const itemId = data[0].content_item_id;
    if (itemId) await supabase.from("content_items").update({ status: "cancelado" }).eq("id", itemId);
    revalidatePath("/dashboard/anuncios");
    revalidatePath("/dashboard/agenda");
    return { success: true };
  } catch {
    return { success: false, error: "Não foi possível cancelar." };
  }
}
