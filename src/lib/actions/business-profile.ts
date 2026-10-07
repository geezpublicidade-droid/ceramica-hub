"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { getBusinessById } from "@/lib/services/platform";
import { translateAndStore } from "@/lib/services/translate";
import { requireOwnBusiness } from "@/lib/auth-guards";
import { gateFeature, gateLimit, getContentUsage, planErrorFromDatabase } from "@/lib/services/company-plan";

type ActionResult = { success: true } | { success: false; error: string };

const addPromotionSchema = z.object({
  title: z.string().trim().min(1, "Informe o título da promoção.").max(120, "Título muito longo."),
  description: z.string().max(1000, "Descrição muito longa."),
  couponCode: z.string().max(40, "Cupom muito longo."),
  maxTotalUses: z.number().int("Informe um número inteiro.").positive("O limite precisa ser maior que zero.").max(100000, "Limite muito alto.").nullable().optional(),
  validUntil: z.string(),
});

function revalidateBusiness(businessId: string, slug: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/empresa/${slug}`);
}

const fail = (error: string): ActionResult => ({ success: false, error });
/** Erro do banco: se for um bloqueio de plano (trigger), mostra a mensagem de plano; senão a mensagem comum. */
const dbFail = (message: string | undefined, fallback: string): ActionResult => fail(planErrorFromDatabase(message) ?? fallback);

// ---- perfil básico ----

type ProfileInput = {
  description: string;
  logoUrl: string;
  coverPhotoUrl: string;
  instagram: string;
  websiteUrl: string;
  openingHours: string;
  videoUrl: string;
};

/**
 * Um campo de plano só pode ser PREENCHIDO ou ALTERADO se o plano incluir o recurso. Se o valor não mudou (empresa que fez
 * downgrade e reenvia o formulário), é aceito sem bloqueio e continua salvo — nada é apagado.
 */
async function blockedProfileField(businessId: string, input: ProfileInput, current: ProfileInput): Promise<string | null> {
  const changed = (next: string, previous: string) => next.trim() !== previous.trim() && next.trim() !== "";
  const checks: { changed: boolean; feature: string; label: string }[] = [
    { changed: changed(input.description, current.description), feature: "full_description", label: "A descrição completa" },
    { changed: changed(input.coverPhotoUrl, current.coverPhotoUrl), feature: "landing_layout", label: "A foto de capa" },
    { changed: changed(input.instagram, current.instagram), feature: "social_media", label: "As redes sociais" },
    { changed: changed(input.websiteUrl, current.websiteUrl), feature: "commercial_info", label: "O site e as informações comerciais" },
    { changed: changed(input.openingHours, current.openingHours), feature: "business_hours", label: "O horário de funcionamento" },
    { changed: changed(input.videoUrl, current.videoUrl), feature: "featured_videos", label: "O vídeo em destaque" },
  ];
  for (const check of checks) {
    if (!check.changed) continue;
    const gate = await gateFeature(businessId, check.feature, check.label);
    if (!gate.ok) return gate.error;
  }
  return null;
}

export async function updateBusinessProfile(input: ProfileInput): Promise<ActionResult> {
  const businessId = await requireOwnBusiness();
  const business = await getBusinessById(businessId);
  if (!business) return fail("Empresa não encontrada.");

  const blocked = await blockedProfileField(businessId, input, {
    description: business.description ?? "",
    logoUrl: business.logo ?? "",
    coverPhotoUrl: business.coverPhoto ?? "",
    instagram: business.instagram ?? "",
    websiteUrl: business.websiteUrl ?? "",
    openingHours: business.openingHours ?? "",
    videoUrl: business.videoUrl ?? "",
  });
  if (blocked) return fail(blocked);

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("businesses")
    .update({
      description: input.description.trim() || null,
      logo_url: input.logoUrl.trim() || null,
      cover_photo_url: input.coverPhotoUrl.trim() || null,
      instagram: input.instagram.trim() || null,
      website_url: input.websiteUrl.trim() || null,
      opening_hours: input.openingHours.trim() || null,
      video_url: input.videoUrl.trim() || null,
    })
    .eq("id", businessId);
  if (error) return fail("Não foi possível salvar.");

  await translateAndStore("business", businessId, {
    description: input.description.trim(),
    opening_hours: input.openingHours.trim(),
  });

  revalidateBusiness(businessId, business.slug);
  return { success: true };
}

// ---- serviços ----

export async function addService(name: string, description: string): Promise<ActionResult> {
  const businessId = await requireOwnBusiness();
  const business = await getBusinessById(businessId);
  if (!business) return fail("Empresa não encontrada.");
  if (!name.trim()) return fail("Informe o nome do serviço.");

  const usage = await getContentUsage(businessId);
  const gate = await gateLimit(businessId, "services", usage.services ?? 0, "serviços");
  if (!gate.ok) return fail(gate.error);

  const supabase = createServiceClient();
  const { count } = await supabase.from("business_services").select("id", { count: "exact", head: true }).eq("business_id", businessId);
  const { data: inserted, error } = await supabase
    .from("business_services")
    .insert({ business_id: businessId, name: name.trim(), description: description.trim() || null, sort_order: count ?? 0 })
    .select("id")
    .single();
  if (error) return dbFail(error.message, "Não foi possível adicionar o serviço.");

  await translateAndStore("business_service", inserted.id, {
    name: name.trim(),
    description: description.trim(),
  });

  revalidateBusiness(businessId, business.slug);
  return { success: true };
}

export async function deleteService(serviceId: string): Promise<ActionResult> {
  const businessId = await requireOwnBusiness();
  const business = await getBusinessById(businessId);
  if (!business) return fail("Empresa não encontrada.");

  const supabase = createServiceClient();
  const { error } = await supabase.from("business_services").delete().eq("id", serviceId).eq("business_id", businessId);
  if (error) return fail("Não foi possível remover o serviço.");

  revalidateBusiness(businessId, business.slug);
  return { success: true };
}

// ---- galeria ----

export async function addPhoto(url: string): Promise<ActionResult> {
  const businessId = await requireOwnBusiness();
  const business = await getBusinessById(businessId);
  if (!business) return fail("Empresa não encontrada.");
  if (!url.trim()) return fail("Informe a URL da imagem.");

  const usage = await getContentUsage(businessId);
  const gate = await gateLimit(businessId, "gallery_images", usage.gallery_images ?? 0, "imagens na galeria");
  if (!gate.ok) return fail(gate.error);

  const supabase = createServiceClient();
  const { count } = await supabase.from("business_photos").select("id", { count: "exact", head: true }).eq("business_id", businessId);
  const { error } = await supabase.from("business_photos").insert({ business_id: businessId, url: url.trim(), sort_order: count ?? 0 });
  if (error) return dbFail(error.message, "Não foi possível adicionar a imagem.");

  revalidateBusiness(businessId, business.slug);
  return { success: true };
}

export async function deletePhoto(photoId: string): Promise<ActionResult> {
  const businessId = await requireOwnBusiness();
  const business = await getBusinessById(businessId);
  if (!business) return fail("Empresa não encontrada.");

  const supabase = createServiceClient();
  const { error } = await supabase.from("business_photos").delete().eq("id", photoId).eq("business_id", businessId);
  if (error) return fail("Não foi possível remover a imagem.");

  revalidateBusiness(businessId, business.slug);
  return { success: true };
}

// ---- visita virtual 360 ----

type UploadResult = { success: true; url: string } | { success: false; error: string };

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export async function uploadVirtualTourImage(formData: FormData): Promise<UploadResult> {
  const businessId = await requireOwnBusiness();
  const business = await getBusinessById(businessId);
  if (!business) return { success: false, error: "Empresa não encontrada." };

  const gate = await gateFeature(businessId, "tour_3d");
  if (!gate.ok) return { success: false, error: gate.error };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Selecione uma foto." };
  }
  if (!file.type.startsWith("image/")) {
    return { success: false, error: "O arquivo precisa ser uma imagem." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { success: false, error: "Imagem muito grande (máximo 20MB)." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${businessId}/${crypto.randomUUID()}.${extension}`;

  const supabase = createServiceClient();
  const { error: uploadError } = await supabase.storage.from("virtual-tour").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { success: false, error: "Não foi possível enviar a imagem." };

  const { data } = supabase.storage.from("virtual-tour").getPublicUrl(path);
  return { success: true, url: data.publicUrl };
}

export async function addVirtualTourScene(label: string, imageUrl: string): Promise<ActionResult> {
  const businessId = await requireOwnBusiness();
  const business = await getBusinessById(businessId);
  if (!business) return fail("Empresa não encontrada.");
  if (!label.trim()) return fail("Informe um nome pra essa cena (ex: Recepção).");
  if (!imageUrl.trim()) return fail("Informe a URL da foto panorâmica.");

  const gate = await gateFeature(businessId, "tour_3d");
  if (!gate.ok) return fail(gate.error);

  const supabase = createServiceClient();
  const { count } = await supabase.from("virtual_tour_scenes").select("id", { count: "exact", head: true }).eq("business_id", businessId);

  const { data: inserted, error } = await supabase
    .from("virtual_tour_scenes")
    .insert({ business_id: businessId, label: label.trim(), image_url: imageUrl.trim(), sort_order: count ?? 0 })
    .select("id")
    .single();
  if (error) return fail("Não foi possível adicionar a cena.");

  await translateAndStore("virtual_tour_scene", inserted.id, { label: label.trim() });

  revalidateBusiness(businessId, business.slug);
  return { success: true };
}

export async function deleteVirtualTourScene(sceneId: string): Promise<ActionResult> {
  const businessId = await requireOwnBusiness();
  const business = await getBusinessById(businessId);
  if (!business) return fail("Empresa não encontrada.");

  const supabase = createServiceClient();
  const { error } = await supabase.from("virtual_tour_scenes").delete().eq("id", sceneId).eq("business_id", businessId);
  if (error) return fail("Não foi possível remover a cena.");

  revalidateBusiness(businessId, business.slug);
  return { success: true };
}

// ---- promoções ----

export async function addPromotion(rawInput: {
  title: string;
  description: string;
  couponCode: string;
  validUntil: string;
  maxTotalUses?: number | null;
}): Promise<ActionResult> {
  const parsed = addPromotionSchema.safeParse(rawInput);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  const input = parsed.data;

  const businessId = await requireOwnBusiness();
  const business = await getBusinessById(businessId);
  if (!business) return fail("Empresa não encontrada.");

  const usage = await getContentUsage(businessId);
  const gate = await gateLimit(businessId, "active_promotions", usage.active_promotions ?? 0, "promoções ativas");
  if (!gate.ok) return fail(gate.error);

  const hasCoupon = input.couponCode.trim() !== "";
  if (hasCoupon) {
    const couponGate = await gateFeature(businessId, "trackable_coupons");
    if (!couponGate.ok) return fail(couponGate.error);
  }

  const supabase = createServiceClient();
  const { data: inserted, error } = await supabase
    .from("benefits")
    .insert({
      business_id: businessId,
      kind: "promocao",
      title: input.title.trim(),
      description: input.description.trim() || null,
      coupon_code: hasCoupon ? input.couponCode.trim() : null,
      valid_until: input.validUntil || null,
      max_total_uses: hasCoupon ? input.maxTotalUses ?? null : null,
      active: true,
    })
    .select("id")
    .single();
  if (error) return dbFail(error.message, "Não foi possível criar a promoção.");

  await translateAndStore("benefit", inserted.id, {
    title: input.title.trim(),
    description: input.description.trim(),
  });

  revalidateBusiness(businessId, business.slug);
  return { success: true };
}

export async function deactivatePromotion(benefitId: string): Promise<ActionResult> {
  const businessId = await requireOwnBusiness();
  const business = await getBusinessById(businessId);
  if (!business) return fail("Empresa não encontrada.");

  const supabase = createServiceClient();
  const { error } = await supabase.from("benefits").update({ active: false }).eq("id", benefitId).eq("business_id", businessId);
  if (error) return fail("Não foi possível encerrar a promoção.");

  revalidateBusiness(businessId, business.slug);
  return { success: true };
}
