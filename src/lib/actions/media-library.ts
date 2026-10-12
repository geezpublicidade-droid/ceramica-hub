"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireOwnBusiness } from "@/lib/auth-guards";

type Result = { success: true } | { success: false; error: string };

const KINDS = ["logo", "foto", "video", "banner", "story", "documento"] as const;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 30 * 1024 * 1024;
const MAX_DOC_BYTES = 10 * 1024 * 1024;
const MAX_ITEMS = 200;

function validate(kind: string, file: File): string | null {
  if (kind === "video") {
    if (!VIDEO_TYPES.includes(file.type)) return "Use um vídeo MP4 ou WebM.";
    return file.size > MAX_VIDEO_BYTES ? "Vídeo acima de 30MB." : null;
  }
  if (kind === "documento") {
    if (file.type !== "application/pdf") return "Documentos devem ser PDF.";
    return file.size > MAX_DOC_BYTES ? "Documento acima de 10MB." : null;
  }
  if (!IMAGE_TYPES.includes(file.type)) return "Use uma imagem JPG, PNG ou WebP.";
  return file.size > MAX_IMAGE_BYTES ? "Imagem acima de 8MB." : null;
}

/** Guarda um arquivo na biblioteca da empresa (imagens têm as dimensões lidas para o aviso de tamanho). */
export async function uploadMedia(formData: FormData): Promise<Result> {
  try {
    const businessId = await requireOwnBusiness();
    const kind = String(formData.get("kind") ?? "foto");
    const file = formData.get("file");
    if (!KINDS.includes(kind as (typeof KINDS)[number])) return { success: false, error: "Tipo de mídia inválido." };
    if (!(file instanceof File) || file.size === 0) return { success: false, error: "Selecione um arquivo." };
    const problem = validate(kind, file);
    if (problem) return { success: false, error: problem };

    const supabase = createServiceClient();
    const { count } = await supabase.from("business_media").select("id", { count: "exact", head: true }).eq("business_id", businessId);
    if ((count ?? 0) >= MAX_ITEMS) return { success: false, error: "Biblioteca cheia. Remova arquivos que não usa mais." };

    const bytes = Buffer.from(await file.arrayBuffer());
    let width: number | null = null;
    let height: number | null = null;
    if (IMAGE_TYPES.includes(file.type)) {
      const { default: sharp } = await import("sharp");
      const meta = await sharp(bytes).metadata();
      width = meta.width ?? null;
      height = meta.height ?? null;
    }
    const extension = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${businessId}/midias/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("business-photos").upload(path, bytes, { contentType: file.type, upsert: false });
    if (uploadError) return { success: false, error: "Não foi possível enviar o arquivo." };

    const { error } = await supabase.from("business_media").insert({
      business_id: businessId,
      kind,
      name: file.name.slice(0, 120),
      url: supabase.storage.from("business-photos").getPublicUrl(path).data.publicUrl,
      width,
      height,
      bytes: file.size,
    });
    if (error) return { success: false, error: "Não foi possível registrar o arquivo." };
    revalidatePath("/dashboard/midias");
    return { success: true };
  } catch {
    return { success: false, error: "Não foi possível enviar. Tente de novo." };
  }
}

export async function deleteMedia(mediaId: string): Promise<Result> {
  try {
    const businessId = await requireOwnBusiness();
    const { error } = await createServiceClient().from("business_media").delete().eq("id", mediaId).eq("business_id", businessId);
    if (error) return { success: false, error: "Não foi possível remover." };
    revalidatePath("/dashboard/midias");
    return { success: true };
  } catch {
    return { success: false, error: "Não foi possível remover." };
  }
}
