"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { limitsFor } from "@/lib/plan-limits";
import { getBusinessById } from "@/lib/services/platform";

type ActionResult = { success: true } | { success: false; error: string };

async function requireOwnBusiness() {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) throw new Error("Não autenticado.");
  return businessId;
}

function revalidateBusiness(businessId: string, slug: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/empresa/${slug}`);
}

// ---- perfil básico ----

export async function updateBusinessProfile(input: {
  description: string;
  logoUrl: string;
  coverPhotoUrl: string;
  instagram: string;
  websiteUrl: string;
  openingHours: string;
  videoUrl: string;
}): Promise<ActionResult> {
  const businessId = await requireOwnBusiness();
  const business = await getBusinessById(businessId);
  if (!business) return { success: false, error: "Empresa não encontrada." };

  const limits = limitsFor(business.effectivePlan);
  if (input.videoUrl.trim() && !limits.videoAllowed) {
    return { success: false, error: "Vídeo em destaque é um recurso do plano Experiência." };
  }

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
      video_url: limits.videoAllowed ? input.videoUrl.trim() || null : null,
    })
    .eq("id", businessId);
  if (error) return { success: false, error: "Não foi possível salvar." };

  revalidateBusiness(businessId, business.slug);
  return { success: true };
}

// ---- serviços ----

export async function addService(name: string, description: string): Promise<ActionResult> {
  const businessId = await requireOwnBusiness();
  const business = await getBusinessById(businessId);
  if (!business) return { success: false, error: "Empresa não encontrada." };
  if (!name.trim()) return { success: false, error: "Informe o nome do serviço." };

  const limits = limitsFor(business.effectivePlan);
  const supabase = createServiceClient();
  const { count } = await supabase
    .from("business_services")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId);

  if ((count ?? 0) >= limits.maxServices) {
    return {
      success: false,
      error: `Esse recurso faz parte do plano superior. Seu plano atual permite até ${limits.maxServices} serviços.`,
    };
  }

  const { error } = await supabase
    .from("business_services")
    .insert({ business_id: businessId, name: name.trim(), description: description.trim() || null, sort_order: count ?? 0 });
  if (error) return { success: false, error: "Não foi possível adicionar o serviço." };

  revalidateBusiness(businessId, business.slug);
  return { success: true };
}

export async function deleteService(serviceId: string): Promise<ActionResult> {
  const businessId = await requireOwnBusiness();
  const business = await getBusinessById(businessId);
  if (!business) return { success: false, error: "Empresa não encontrada." };

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("business_services")
    .delete()
    .eq("id", serviceId)
    .eq("business_id", businessId);
  if (error) return { success: false, error: "Não foi possível remover o serviço." };

  revalidateBusiness(businessId, business.slug);
  return { success: true };
}

// ---- galeria ----

export async function addPhoto(url: string): Promise<ActionResult> {
  const businessId = await requireOwnBusiness();
  const business = await getBusinessById(businessId);
  if (!business) return { success: false, error: "Empresa não encontrada." };
  if (!url.trim()) return { success: false, error: "Informe a URL da imagem." };

  const limits = limitsFor(business.effectivePlan);
  const supabase = createServiceClient();
  const { count } = await supabase
    .from("business_photos")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId);

  if ((count ?? 0) >= limits.maxPhotos) {
    return {
      success: false,
      error: `Esse recurso faz parte do plano superior. Seu plano atual permite até ${limits.maxPhotos} ${limits.maxPhotos === 1 ? "imagem" : "imagens"} na galeria.`,
    };
  }

  const { error } = await supabase
    .from("business_photos")
    .insert({ business_id: businessId, url: url.trim(), sort_order: count ?? 0 });
  if (error) return { success: false, error: "Não foi possível adicionar a imagem." };

  revalidateBusiness(businessId, business.slug);
  return { success: true };
}

export async function deletePhoto(photoId: string): Promise<ActionResult> {
  const businessId = await requireOwnBusiness();
  const business = await getBusinessById(businessId);
  if (!business) return { success: false, error: "Empresa não encontrada." };

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("business_photos")
    .delete()
    .eq("id", photoId)
    .eq("business_id", businessId);
  if (error) return { success: false, error: "Não foi possível remover a imagem." };

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

  const limits = limitsFor(business.effectivePlan);
  if (!limits.virtualTourAllowed) {
    return { success: false, error: "Visita virtual 360° é um recurso do plano Experiência." };
  }

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
  const { error: uploadError } = await supabase.storage
    .from("virtual-tour")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { success: false, error: "Não foi possível enviar a imagem." };

  const { data } = supabase.storage.from("virtual-tour").getPublicUrl(path);
  return { success: true, url: data.publicUrl };
}

export async function addVirtualTourScene(label: string, imageUrl: string): Promise<ActionResult> {
  const businessId = await requireOwnBusiness();
  const business = await getBusinessById(businessId);
  if (!business) return { success: false, error: "Empresa não encontrada." };
  if (!label.trim()) return { success: false, error: "Informe um nome pra essa cena (ex: Recepção)." };
  if (!imageUrl.trim()) return { success: false, error: "Informe a URL da foto panorâmica." };

  const limits = limitsFor(business.effectivePlan);
  if (!limits.virtualTourAllowed) {
    return { success: false, error: "Visita virtual 360° é um recurso do plano Experiência." };
  }

  const supabase = createServiceClient();
  const { count } = await supabase
    .from("virtual_tour_scenes")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId);

  const { error } = await supabase
    .from("virtual_tour_scenes")
    .insert({ business_id: businessId, label: label.trim(), image_url: imageUrl.trim(), sort_order: count ?? 0 });
  if (error) return { success: false, error: "Não foi possível adicionar a cena." };

  revalidateBusiness(businessId, business.slug);
  return { success: true };
}

export async function deleteVirtualTourScene(sceneId: string): Promise<ActionResult> {
  const businessId = await requireOwnBusiness();
  const business = await getBusinessById(businessId);
  if (!business) return { success: false, error: "Empresa não encontrada." };

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("virtual_tour_scenes")
    .delete()
    .eq("id", sceneId)
    .eq("business_id", businessId);
  if (error) return { success: false, error: "Não foi possível remover a cena." };

  revalidateBusiness(businessId, business.slug);
  return { success: true };
}

// ---- promoções ----

export async function addPromotion(input: {
  title: string;
  description: string;
  couponCode: string;
  validUntil: string;
}): Promise<ActionResult> {
  const businessId = await requireOwnBusiness();
  const business = await getBusinessById(businessId);
  if (!business) return { success: false, error: "Empresa não encontrada." };
  if (!input.title.trim()) return { success: false, error: "Informe o título da promoção." };

  const limits = limitsFor(business.effectivePlan);
  if (limits.maxPromotions === 0) {
    return { success: false, error: "Esse recurso faz parte do plano superior. Faça upgrade para publicar promoções." };
  }
  if (input.couponCode.trim() && !limits.couponsAllowed) {
    return { success: false, error: "Cupons rastreáveis fazem parte do plano Destaque." };
  }

  const supabase = createServiceClient();
  const { count } = await supabase
    .from("benefits")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("active", true);

  if ((count ?? 0) >= limits.maxPromotions) {
    return {
      success: false,
      error: `Esse recurso faz parte do plano superior. Seu plano atual permite até ${limits.maxPromotions} promoção${limits.maxPromotions > 1 ? "ões" : ""} ativa${limits.maxPromotions > 1 ? "s" : ""}.`,
    };
  }

  const { error } = await supabase.from("benefits").insert({
    business_id: businessId,
    kind: "promocao",
    title: input.title.trim(),
    description: input.description.trim() || null,
    coupon_code: limits.couponsAllowed ? input.couponCode.trim() || null : null,
    valid_until: input.validUntil || null,
    active: true,
  });
  if (error) return { success: false, error: "Não foi possível criar a promoção." };

  revalidateBusiness(businessId, business.slug);
  return { success: true };
}

export async function deactivatePromotion(benefitId: string): Promise<ActionResult> {
  const businessId = await requireOwnBusiness();
  const business = await getBusinessById(businessId);
  if (!business) return { success: false, error: "Empresa não encontrada." };

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("benefits")
    .update({ active: false })
    .eq("id", benefitId)
    .eq("business_id", businessId);
  if (error) return { success: false, error: "Não foi possível encerrar a promoção." };

  revalidateBusiness(businessId, business.slug);
  return { success: true };
}
