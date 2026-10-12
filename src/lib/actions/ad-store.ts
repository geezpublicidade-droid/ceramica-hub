"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireBusinessOwner } from "@/lib/auth-guards";
import { safeHref } from "@/lib/category-page";
import { checkCreativeSize, CREATIVE_TYPES, MAX_CREATIVE_BYTES } from "@/lib/ad-creative";
import { countDays, isRangeAvailable, occupancyByDay, priceForPeriod, validatePeriod } from "@/lib/ad-schedule";
import { getHoldingBookings } from "@/lib/services/ad-store";
import { createTicket } from "@/lib/services/support";
import { getBusinessById } from "@/lib/services/platform";
import { getCompanyPermissions } from "@/lib/services/company-plan";
import { applyDiscount, discountFor } from "@/lib/ad-plan-benefits";

type Result = { success: true } | { success: false; error: string };
type UploadResult = { success: true; url: string } | { success: false; error: string };

const DEFAULT_LEAD_DAYS = 2;

type PlacementForSale = {
  id: string; name: string; width: number; height: number; mobile_width: number | null; mobile_height: number | null;
  monthly_price_cents: number; min_days: number; max_days: number; creative_deadline_days: number | null; max_concurrent: number;
  exclusive_by_category: boolean;
};

const PLACEMENT_COLUMNS =
  "id, name, width, height, mobile_width, mobile_height, monthly_price_cents, min_days, max_days, creative_deadline_days, max_concurrent, exclusive_by_category";

async function loadSellablePlacement(placementId: string): Promise<PlacementForSale | null> {
  const { data } = await createServiceClient()
    .from("ad_placements")
    .select(PLACEMENT_COLUMNS)
    .eq("id", placementId)
    .eq("sellable", true)
    .eq("active", true)
    .not("monthly_price_cents", "is", null)
    .maybeSingle();
  return (data as PlacementForSale | null) ?? null;
}

function targetFor(placement: PlacementForSale, device: "desktop" | "mobile") {
  if (device === "mobile") {
    return { width: placement.mobile_width ?? placement.width, height: placement.mobile_height ?? placement.height };
  }
  return { width: placement.width, height: placement.height };
}

/** Outra empresa da mesma categoria com reserva (aprovada ou em análise) cruzando o período neste espaço. */
async function findCategoryRival(placementId: string, businessId: string, category: string, startsAt: string, endsAt: string): Promise<boolean> {
  const { data } = await createServiceClient()
    .from("ad_campaigns")
    .select("business_id, businesses(category)")
    .eq("placement_id", placementId)
    .in("status", ["pending_review", "approved"])
    .not("business_id", "is", null)
    .neq("business_id", businessId)
    .lte("starts_at", endsAt)
    .gte("ends_at", startsAt);
  return (data ?? []).some((row) => (row.businesses as unknown as { category: string } | null)?.category === category);
}

/** Envia a arte do anúncio, conferindo tipo, peso e proporção contra a medida do espaço. */
export async function uploadAdCreative(formData: FormData): Promise<UploadResult> {
  try {
    const businessId = await requireBusinessOwner();
    const file = formData.get("file");
    const device = formData.get("device") === "mobile" ? "mobile" : "desktop";
    const placement = await loadSellablePlacement(String(formData.get("placementId") ?? ""));
    if (!placement) return { success: false, error: "Espaço indisponível." };
    if (!(file instanceof File) || file.size === 0) return { success: false, error: "Selecione a imagem." };
    if (!CREATIVE_TYPES.includes(file.type)) return { success: false, error: "Use JPG, PNG ou WebP." };
    if (file.size > MAX_CREATIVE_BYTES) return { success: false, error: "Arquivo acima de 4MB." };

    const bytes = Buffer.from(await file.arrayBuffer());
    const { default: sharp } = await import("sharp");
    const meta = await sharp(bytes).metadata();
    const problem = checkCreativeSize(meta.width ?? 0, meta.height ?? 0, targetFor(placement, device));
    if (problem) return { success: false, error: problem };

    const extension = file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${businessId}/ads/${crypto.randomUUID()}.${extension}`;
    const supabase = createServiceClient();
    const { error } = await supabase.storage.from("business-photos").upload(path, bytes, { contentType: file.type, upsert: false });
    if (error) return { success: false, error: "Não foi possível enviar a imagem." };
    return { success: true, url: supabase.storage.from("business-photos").getPublicUrl(path).data.publicUrl };
  } catch {
    return { success: false, error: "Não foi possível enviar a imagem." };
  }
}

const bookingSchema = z.object({
  placementId: z.string().uuid(),
  startsAt: z.string(),
  endsAt: z.string(),
  title: z.string().trim().min(3, "Dê um título à campanha.").max(80),
  description: z.string().trim().max(200).optional(),
  targetUrl: z.string().trim().min(1, "Informe para onde o anúncio leva."),
  desktopImageUrl: z.string().url("Envie a arte para computador."),
  mobileImageUrl: z.string().url("Envie a arte para celular."),
});

/** Reserva o espaço: valida período e vaga no servidor, calcula o preço e cria a campanha aguardando pagamento. */
export async function bookAdSpace(raw: z.input<typeof bookingSchema>): Promise<Result> {
  try {
    const businessId = await requireBusinessOwner();
    const parsed = bookingSchema.safeParse(raw);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
    const input = parsed.data;

    const placement = await loadSellablePlacement(input.placementId);
    if (!placement) return { success: false, error: "Este espaço não está disponível para reserva." };

    const target = safeHref(input.targetUrl, "");
    if (!target.href) return { success: false, error: "O link do anúncio precisa começar com https:// ou ser uma página do site." };

    const today = new Date().toISOString().slice(0, 10);
    const periodError = validatePeriod(input.startsAt, input.endsAt, today, {
      minDays: placement.min_days,
      maxDays: placement.max_days,
      leadDays: placement.creative_deadline_days ?? DEFAULT_LEAD_DAYS,
    });
    if (periodError) return { success: false, error: periodError };

    const supabase = createServiceClient();
    const held = (await getHoldingBookings([placement.id], input.startsAt, input.endsAt)).get(placement.id) ?? [];
    if (!isRangeAvailable(held, placement.max_concurrent, input.startsAt, input.endsAt)) {
      return { success: false, error: "Este espaço acabou de ser reservado nessas datas. Escolha outro período." };
    }

    const business = await getBusinessById(businessId);
    if (placement.exclusive_by_category && business?.category) {
      const rival = await findCategoryRival(placement.id, businessId, business.category, input.startsAt, input.endsAt);
      if (rival) return { success: false, error: "Este espaço tem exclusividade por segmento: já existe uma empresa da sua categoria nesse período. Escolha outras datas." };
    }

    const permissions = await getCompanyPermissions(businessId);
    const basePrice = priceForPeriod(placement.monthly_price_cents, countDays(input.startsAt, input.endsAt));
    const priceCents = applyDiscount(basePrice, discountFor(permissions?.plan ?? "presenca"));
    const { data: campaign, error } = await supabase
      .from("ad_campaigns")
      .insert({
        business_id: businessId,
        placement_id: placement.id,
        title: input.title,
        description: input.description || null,
        target_url: target.href,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
        negotiated_value_cents: priceCents,
        price_cents: priceCents,
        status: "pending_review",
        payment_status: "pendente",
        source: "loja",
      })
      .select("id")
      .single();
    if (error || !campaign) return { success: false, error: "Não foi possível criar a reserva." };

    const { error: creativeError } = await supabase.from("ad_creatives").insert([
      { campaign_id: campaign.id, device: "desktop", image_url: input.desktopImageUrl, alt_text: input.title },
      { campaign_id: campaign.id, device: "mobile", image_url: input.mobileImageUrl, alt_text: input.title },
    ]);
    if (creativeError) {
      await supabase.from("ad_campaigns").delete().eq("id", campaign.id);
      return { success: false, error: "Não foi possível salvar as artes." };
    }

    // Segunda conferência: se duas empresas clicaram juntas e passou da capacidade, a última a gravar desiste.
    const after = (await getHoldingBookings([placement.id], input.startsAt, input.endsAt)).get(placement.id) ?? [];
    const overbooked = occupancyByDay(after, placement.max_concurrent, input.startsAt, countDays(input.startsAt, input.endsAt)).some(
      (day) => day.used > placement.max_concurrent,
    );
    if (overbooked) {
      await supabase.from("ad_campaigns").delete().eq("id", campaign.id);
      return { success: false, error: "Este espaço acabou de ser reservado nessas datas. Escolha outro período." };
    }

    await createTicket({
      requester: { type: "business", id: businessId },
      requesterName: business?.name ?? "Empresa",
      requesterContact: business?.phone ?? "",
      subject: `Reserva de espaço: ${placement.name}`,
      message: `Reserva de "${placement.name}" de ${input.startsAt} a ${input.endsAt} (${priceCents / 100} R$). Aguardando pagamento e aprovação da arte.`,
    });
    revalidatePath("/dashboard/anuncios");
    revalidatePath("/admin/publicidade");
    return { success: true };
  } catch {
    return { success: false, error: "Não foi possível concluir a reserva. Tente de novo." };
  }
}

/** A empresa desiste de uma reserva que ainda não foi paga nem aprovada. */
export async function cancelMyAdBooking(campaignId: string): Promise<Result> {
  try {
    const businessId = await requireBusinessOwner();
    const { data, error } = await createServiceClient()
      .from("ad_campaigns")
      .delete()
      .eq("id", campaignId)
      .eq("business_id", businessId)
      .eq("source", "loja")
      .eq("status", "pending_review")
      .eq("payment_status", "pendente")
      .select("id");
    if (error || !data?.length) return { success: false, error: "Só é possível cancelar reservas ainda não pagas." };
    revalidatePath("/dashboard/anuncios");
    return { success: true };
  } catch {
    return { success: false, error: "Não foi possível cancelar." };
  }
}
