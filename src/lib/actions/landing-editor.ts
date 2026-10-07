"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit-log";
import { resolveLandingTarget, type LandingTarget } from "@/lib/landing/guard";
import { brandingSchema, brandingToRow, checkBrandingAgainstPlan, checkPatchAgainstPlan, landingPatchSchema, patchToRow } from "@/lib/landing/editor-schema";
import { translateAndStore } from "@/lib/services/translate";
import { resolveRange, summarizeEvents, type LandingMetrics, type RangePreset } from "@/lib/landing/metrics";

type Result = { success: true } | { success: false; error: string };
type UploadResult = { success: true; url: string } | { success: false; error: string };

const fail = (error: string): Result => ({ success: false, error });
const firstIssue = (error: z.ZodError) => error.issues[0]?.message ?? "Dados inválidos.";

/** Roda uma ação já autorizada; qualquer erro de acesso vira mensagem em vez de exceção solta. */
async function withTarget(adminBusinessId: string | undefined, run: (target: LandingTarget) => Promise<Result>): Promise<Result> {
  try {
    return await run(await resolveLandingTarget(adminBusinessId));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Não foi possível concluir.");
  }
}

function refresh(target: LandingTarget) {
  revalidatePath("/[locale]/empresa/[slug]", "page");
  revalidatePath("/dashboard/landing");
  revalidatePath(`/admin/empresas/${target.businessId}/landing`);
}

async function audit(target: LandingTarget, action: string, details?: Record<string, unknown>) {
  if (target.adminId) await logAdminAction(target.adminId, action, "business", target.businessId, details);
}

// ---- configuração (abas de texto) ----

/** Salva só os campos enviados: cada aba manda o seu pedaço e o resto da configuração fica como está. */
export async function saveLandingConfig(adminBusinessId: string | undefined, rawPatch: unknown): Promise<Result> {
  const parsed = landingPatchSchema.safeParse(rawPatch);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  return withTarget(adminBusinessId, async (target) => {
    const planError = checkPatchAgainstPlan(parsed.data, target.capabilities);
    if (planError) return fail(planError);

    const row = { ...patchToRow(parsed.data), business_id: target.businessId, updated_at: new Date().toISOString() };
    const { error } = await createServiceClient().from("business_landing").upsert(row, { onConflict: "business_id" });
    if (error) return fail("Não foi possível salvar.");

    await audit(target, "edit_landing", { fields: Object.keys(parsed.data) });
    refresh(target);
    return { success: true };
  });
}

/** Logo, capa, descrição, Instagram e site da empresa (a empresa e o admin editam; a descrição é retraduzida). */
export async function saveBranding(adminBusinessId: string | undefined, rawPatch: unknown): Promise<Result> {
  const parsed = brandingSchema.safeParse(rawPatch);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  return withTarget(adminBusinessId, async (target) => {
    const planError = checkBrandingAgainstPlan(parsed.data, target.capabilities);
    if (planError) return fail(planError);

    const { error } = await createServiceClient().from("businesses").update(brandingToRow(parsed.data)).eq("id", target.businessId);
    if (error) return fail("Não foi possível salvar.");

    if (parsed.data.description !== undefined) {
      await translateAndStore("business", target.businessId, { description: parsed.data.description ?? "" }).catch(() => undefined);
    }
    await audit(target, "edit_business_branding", { fields: Object.keys(parsed.data) });
    revalidatePath("/[locale]/empresas", "page");
    refresh(target);
    return { success: true };
  });
}

/** Publica ou volta para rascunho (rascunho: o público vê só o conteúdo básico da empresa). */
export async function setLandingStatus(adminBusinessId: string | undefined, status: "draft" | "published"): Promise<Result> {
  if (status !== "draft" && status !== "published") return fail("Status inválido.");
  return withTarget(adminBusinessId, async (target) => {
    const { error } = await createServiceClient()
      .from("business_landing")
      .upsert({ business_id: target.businessId, status, updated_at: new Date().toISOString() }, { onConflict: "business_id" });
    if (error) return fail("Não foi possível alterar a publicação.");
    await audit(target, status === "published" ? "publish_landing" : "unpublish_landing");
    refresh(target);
    return { success: true };
  });
}

// ---- FAQ ----

const MAX_FAQS = 12;
const faqSchema = z.object({
  id: z.string().uuid().optional(),
  question: z.string().trim().min(3, "Escreva a pergunta.").max(160, "Pergunta muito longa."),
  answer: z.string().trim().min(2, "Escreva a resposta.").max(800, "Resposta muito longa."),
  active: z.boolean().optional(),
});

export async function saveFaq(adminBusinessId: string | undefined, raw: z.input<typeof faqSchema>): Promise<Result> {
  const parsed = faqSchema.safeParse(raw);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { id, ...fields } = parsed.data;

  return withTarget(adminBusinessId, async (target) => {
    if (!target.capabilities.faq) return fail("Perguntas frequentes fazem parte de um plano superior.");
    const supabase = createServiceClient();

    if (id) {
      const { error } = await supabase.from("business_faqs").update(fields).eq("id", id).eq("business_id", target.businessId);
      if (error) return fail("Não foi possível salvar a pergunta.");
    } else {
      const { count } = await supabase.from("business_faqs").select("id", { count: "exact", head: true }).eq("business_id", target.businessId);
      if ((count ?? 0) >= MAX_FAQS) return fail(`Limite de ${MAX_FAQS} perguntas.`);
      const { error } = await supabase.from("business_faqs").insert({ ...fields, business_id: target.businessId, sort_order: count ?? 0 });
      if (error) return fail("Não foi possível adicionar a pergunta.");
    }
    refresh(target);
    return { success: true };
  });
}

export async function deleteFaq(adminBusinessId: string | undefined, faqId: string): Promise<Result> {
  return withTarget(adminBusinessId, async (target) => {
    const { error } = await createServiceClient().from("business_faqs").delete().eq("id", faqId).eq("business_id", target.businessId);
    if (error) return fail("Não foi possível remover a pergunta.");
    refresh(target);
    return { success: true };
  });
}

/** Reordena por uma lista de ids (a posição na lista vira sort_order); ids de outra empresa são ignorados. */
async function reorder(table: "business_faqs" | "business_services" | "business_photos", target: LandingTarget, ids: string[]): Promise<Result> {
  const supabase = createServiceClient();
  const results = await Promise.all(ids.map((id, index) => supabase.from(table).update({ sort_order: index }).eq("id", id).eq("business_id", target.businessId)));
  if (results.some((result) => result.error)) return fail("Não foi possível reordenar.");
  refresh(target);
  return { success: true };
}

const idList = z.array(z.string().uuid()).max(60);

export async function reorderFaqs(adminBusinessId: string | undefined, ids: string[]): Promise<Result> {
  const parsed = idList.safeParse(ids);
  if (!parsed.success) return fail("Lista inválida.");
  return withTarget(adminBusinessId, (target) => reorder("business_faqs", target, parsed.data));
}

// ---- serviços ----

const serviceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2, "Informe o nome do serviço.").max(80, "Nome muito longo."),
  description: z.string().trim().max(300, "Descrição muito longa.").nullable(),
  startingPrice: z.number().min(0).max(1_000_000).nullable(),
  duration: z.string().trim().max(30, "Duração muito longa.").nullable(),
  ctaLabel: z.string().trim().max(30, "Texto do botão muito longo.").nullable(),
  photoUrl: z.string().trim().max(500).refine((v) => v === "" || /^https:\/\//i.test(v), "Use um link https.").nullable(),
  active: z.boolean(),
});

/** Detalhes da landing de um serviço já cadastrado (criar/excluir continuam nas ações do editor de página). */
export async function updateServiceDetails(adminBusinessId: string | undefined, raw: z.input<typeof serviceSchema>): Promise<Result> {
  const parsed = serviceSchema.safeParse(raw);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { id, name, description, startingPrice, duration, ctaLabel, photoUrl, active } = parsed.data;

  return withTarget(adminBusinessId, async (target) => {
    const { error } = await createServiceClient()
      .from("business_services")
      .update({ name, description: description || null, starting_price: startingPrice, duration: duration || null, cta_label: ctaLabel || null, photo_url: photoUrl || null, active })
      .eq("id", id)
      .eq("business_id", target.businessId);
    if (error) return fail("Não foi possível salvar o serviço.");
    refresh(target);
    return { success: true };
  });
}

export async function reorderServices(adminBusinessId: string | undefined, ids: string[]): Promise<Result> {
  const parsed = idList.safeParse(ids);
  if (!parsed.success) return fail("Lista inválida.");
  return withTarget(adminBusinessId, (target) => reorder("business_services", target, parsed.data));
}

// ---- galeria e vídeos ----

const mediaSchema = z.object({
  id: z.string().uuid(),
  caption: z.string().trim().max(160).nullable(),
  alt: z.string().trim().max(160).nullable(),
});

export async function updateMediaDetails(adminBusinessId: string | undefined, raw: z.input<typeof mediaSchema>): Promise<Result> {
  const parsed = mediaSchema.safeParse(raw);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  return withTarget(adminBusinessId, async (target) => {
    const { error } = await createServiceClient()
      .from("business_photos")
      .update({ caption: parsed.data.caption || null, alt: parsed.data.alt || null })
      .eq("id", parsed.data.id)
      .eq("business_id", target.businessId);
    if (error) return fail("Não foi possível salvar.");
    refresh(target);
    return { success: true };
  });
}

export async function reorderMedia(adminBusinessId: string | undefined, ids: string[]): Promise<Result> {
  const parsed = idList.safeParse(ids);
  if (!parsed.success) return fail("Lista inválida.");
  return withTarget(adminBusinessId, (target) => reorder("business_photos", target, parsed.data));
}

/** Adiciona foto ou vídeo à galeria já com o limite do plano (vídeo só nos planos que incluem). */
export async function addMedia(adminBusinessId: string | undefined, url: string, kind: "photo" | "video"): Promise<Result> {
  if (!/^https:\/\//i.test(url.trim())) return fail("Envie o arquivo ou use um link https.");
  return withTarget(adminBusinessId, async (target) => {
    const { capabilities } = target;
    if (kind === "video" && !capabilities.video) return fail("Vídeos fazem parte de um plano superior.");
    const supabase = createServiceClient();
    const { count } = await supabase.from("business_photos").select("id", { count: "exact", head: true }).eq("business_id", target.businessId);
    if ((count ?? 0) >= capabilities.maxGalleryItems) return fail(`Seu plano permite até ${capabilities.maxGalleryItems} itens na galeria.`);

    const { error } = await supabase.from("business_photos").insert({ business_id: target.businessId, url: url.trim(), kind, sort_order: count ?? 0 });
    if (error) return fail("Não foi possível adicionar.");
    refresh(target);
    return { success: true };
  });
}

export async function deleteMedia(adminBusinessId: string | undefined, mediaId: string): Promise<Result> {
  return withTarget(adminBusinessId, async (target) => {
    const { error } = await createServiceClient().from("business_photos").delete().eq("id", mediaId).eq("business_id", target.businessId);
    if (error) return fail("Não foi possível remover.");
    refresh(target);
    return { success: true };
  });
}

// ---- oferta (benefício) ----

const offerSchema = z.object({
  id: z.string().uuid(),
  imageUrl: z.string().trim().max(500).refine((v) => v === "" || /^https:\/\//i.test(v), "Use um link https.").nullable(),
  ctaLabel: z.string().trim().max(30, "Texto do botão muito longo.").nullable(),
});

export async function saveOfferDetails(adminBusinessId: string | undefined, raw: z.input<typeof offerSchema>): Promise<Result> {
  const parsed = offerSchema.safeParse(raw);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  return withTarget(adminBusinessId, async (target) => {
    if (!target.capabilities.offer) return fail("A oferta exclusiva faz parte de um plano superior.");
    const { error } = await createServiceClient()
      .from("benefits")
      .update({ image_url: parsed.data.imageUrl || null, cta_label: parsed.data.ctaLabel || null })
      .eq("id", parsed.data.id)
      .eq("business_id", target.businessId);
    if (error) return fail("Não foi possível salvar a oferta.");
    refresh(target);
    return { success: true };
  });
}

// ---- upload de imagem/vídeo ----

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 45 * 1024 * 1024;

function validateUpload(file: unknown, kind: "image" | "video", canUploadVideo: boolean): string | null {
  if (!(file instanceof File) || file.size === 0) return "Selecione um arquivo.";
  if (kind === "video") {
    if (!canUploadVideo) return "Vídeos fazem parte de um plano superior.";
    if (!VIDEO_TYPES.includes(file.type)) return "Use um vídeo MP4 ou WebM.";
    return file.size > MAX_VIDEO_BYTES ? "Vídeo muito grande (máximo 45MB)." : null;
  }
  if (!IMAGE_TYPES.includes(file.type)) return "Use uma imagem JPG, PNG, WebP ou AVIF.";
  return file.size > MAX_IMAGE_BYTES ? "Imagem muito grande (máximo 8MB)." : null;
}

/** Envia imagem ou vídeo para o bucket público da empresa e devolve a URL (quem chama decide onde usar). */
export async function uploadLandingAsset(adminBusinessId: string | undefined, formData: FormData): Promise<UploadResult> {
  try {
    const target = await resolveLandingTarget(adminBusinessId);
    const kind = formData.get("kind") === "video" ? "video" : "image";
    const file = formData.get("file");
    const problem = validateUpload(file, kind, target.capabilities.video);
    if (problem || !(file instanceof File)) return { success: false, error: problem ?? "Selecione um arquivo." };

    const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "bin";
    const path = `${target.businessId}/landing/${crypto.randomUUID()}.${extension}`;
    const supabase = createServiceClient();
    const { error } = await supabase.storage.from("business-photos").upload(path, file, { contentType: file.type, upsert: false });
    if (error) return { success: false, error: "Não foi possível enviar o arquivo." };
    return { success: true, url: supabase.storage.from("business-photos").getPublicUrl(path).data.publicUrl };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Não foi possível enviar." };
  }
}

// ---- leads ----

const leadStatusSchema = z.object({
  leadId: z.string().uuid(),
  status: z.enum(["novo", "em_atendimento", "contatado", "proposta_enviada", "convertido", "perdido"]),
  notes: z.string().trim().max(1000).nullable().optional(),
});

/** Muda o andamento de um lead da própria empresa (admin: de qualquer uma) e guarda observações internas. */
export async function updateLeadStatus(adminBusinessId: string | undefined, raw: z.input<typeof leadStatusSchema>): Promise<Result> {
  const parsed = leadStatusSchema.safeParse(raw);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { leadId, status, notes } = parsed.data;

  return withTarget(adminBusinessId, async (target) => {
    const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (notes !== undefined) update.notes = notes || null;
    const { error } = await createServiceClient().from("business_leads").update(update).eq("id", leadId).eq("business_id", target.businessId);
    if (error) return fail("Não foi possível atualizar o lead.");
    await audit(target, "update_business_lead", { leadId, status });
    revalidatePath("/dashboard/leads");
    return { success: true };
  });
}

// ---- criar/remover serviço (com limite do plano) ----

export async function createService(adminBusinessId: string | undefined, name: string): Promise<Result> {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 80) return fail("Informe o nome do serviço (2 a 80 caracteres).");

  return withTarget(adminBusinessId, async (target) => {
    const supabase = createServiceClient();
    const { count } = await supabase.from("business_services").select("id", { count: "exact", head: true }).eq("business_id", target.businessId);
    const limit = target.capabilities.maxServices;
    if ((count ?? 0) >= limit) {
      return fail(limit === 0 ? "Cadastro de serviços é exclusivo dos planos pagos." : `Seu plano permite até ${limit} serviços.`);
    }
    const { error } = await supabase.from("business_services").insert({ business_id: target.businessId, name: trimmed, sort_order: count ?? 0 });
    if (error) return fail("Não foi possível adicionar o serviço.");
    refresh(target);
    return { success: true };
  });
}

export async function removeService(adminBusinessId: string | undefined, serviceId: string): Promise<Result> {
  return withTarget(adminBusinessId, async (target) => {
    const { error } = await createServiceClient().from("business_services").delete().eq("id", serviceId).eq("business_id", target.businessId);
    if (error) return fail("Não foi possível remover o serviço.");
    refresh(target);
    return { success: true };
  });
}

// ---- métricas da landing ----

const METRIC_EVENTS = [
  "commercial_page_viewed",
  "whatsapp_clicked",
  "phone_clicked",
  "directions_clicked",
  "lead_submitted",
  "offer_clicked",
  "service_clicked",
];
const MAX_METRIC_ROWS = 20000;

export type LandingMetricsResult =
  | { success: true; metrics: LandingMetrics; topServices: { name: string; count: number }[]; truncated: boolean }
  | { success: false; error: string };

/** Métricas da página da empresa num período (hoje, 7/30/90 dias ou datas escolhidas). Só a própria empresa; admin de qualquer uma. */
export async function fetchLandingMetrics(
  adminBusinessId: string | undefined,
  preset: RangePreset,
  custom?: { from?: string; to?: string },
): Promise<LandingMetricsResult> {
  const range = resolveRange(preset, custom);
  if (!range) return { success: false, error: "Período inválido (use datas em ordem, de até 1 ano)." };

  try {
    const target = await resolveLandingTarget(adminBusinessId);
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("metrics_events")
      .select("event_type, metadata, created_at")
      .eq("business_id", target.businessId)
      .in("event_type", METRIC_EVENTS)
      .gte("created_at", range.from)
      .lt("created_at", range.to)
      .limit(MAX_METRIC_ROWS);
    if (error) return { success: false, error: "Não foi possível carregar as métricas." };

    const metrics = summarizeEvents(data ?? []);
    const { data: services } = await supabase.from("business_services").select("id, name").eq("business_id", target.businessId);
    const names = new Map((services ?? []).map((service) => [service.id as string, service.name as string]));
    const topServices = metrics.topServiceIds.map(({ id, count }) => ({ name: names.get(id) ?? "Serviço removido", count }));
    return { success: true, metrics, topServices, truncated: (data?.length ?? 0) >= MAX_METRIC_ROWS };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Não foi possível carregar." };
  }
}
