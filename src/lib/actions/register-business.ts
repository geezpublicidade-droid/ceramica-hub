"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import { translateAndStore } from "@/lib/services/translate";
import { verifyTurnstileToken } from "@/lib/services/turnstile";
import { RATE_LIMITS, withinRateLimit } from "@/lib/services/rate-limit";
import { recordReferral } from "@/lib/services/referrals";
import { REFERRAL_COOKIE } from "@/lib/services/referral-code";
import { draftFromPayload } from "@/lib/profile/draft";
import { applyProfileDraft } from "@/lib/profile/apply";

const CONSENT_VERSION = "1.0";

const registerBusinessSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome da empresa."),
    responsibleName: z.string().trim().min(1, "Informe o nome do responsável."),
    email: z.string().trim().min(1, "Informe o e-mail.").email("Informe um e-mail válido."),
    password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
    phone: z.string().trim().min(1, "Informe o WhatsApp."),
    document: z.string(),
    category: z.string().trim().min(1, "Selecione uma categoria."),
    shortDescription: z.string(),
    towerId: z.string().min(1, "Selecione a torre."),
    floor: z.string().trim().min(1, "Informe o andar."),
    roomNumber: z.string().trim().min(1, "Informe a sala."),
    logoUrl: z.string(),
    coverPhotoUrl: z.string(),
    instagram: z.string(),
    websiteUrl: z.string(),
    openingHours: z.string(),
    termsAccepted: z.boolean(),
    privacyAccepted: z.boolean(),
    registrationPolicyAccepted: z.boolean(),
    imageUsageAuthorized: z.boolean(),
    addressConfirmed: z.boolean(),
    marketingOptIn: z.boolean().optional(),
    comprovantePath: z.string().min(1, "Envie o comprovante de instalação na torre."),
    turnstileToken: z.string().nullable().optional(),
    /** ProfileDraft completo do wizard (serviços, FAQ, fotos, redes...); lido com draftFromPayload, nunca confiado. */
    profile: z.unknown().optional(),
    importedFromGoogle: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.termsAccepted || !data.privacyAccepted || !data.registrationPolicyAccepted || !data.addressConfirmed) {
      ctx.addIssue({
        code: "custom",
        path: ["addressConfirmed"],
        message: "É necessário aceitar os termos, a política de privacidade e confirmar o funcionamento no endereço.",
      });
    }
  });

export type RegisterBusinessInput = z.input<typeof registerBusinessSchema>;

export type RegisterBusinessResult = { success: true; businessId: string } | { success: false; error: string };

type UploadComprovanteResult = { success: true; path: string } | { success: false; error: string };

const MAX_COMPROVANTE_BYTES = 10 * 1024 * 1024;
const ALLOWED_COMPROVANTE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

/** Sobe o comprovante de instalação na torre (contrato, conta de luz, etc.)
 * antes de o cadastro da empresa existir -- por isso o caminho vive sob
 * `pending/`, identificado só por um UUID aleatório, e é referenciado por
 * `comprovante_path` quando o registro é criado logo em seguida. O bucket
 * `comprovantes` é privado (nunca exposto por URL pública, só signed URL
 * gerada pelo admin em getComprovanteSignedUrl). */
export async function uploadComprovante(formData: FormData): Promise<UploadComprovanteResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Selecione o arquivo do comprovante." };
  }
  if (!ALLOWED_COMPROVANTE_TYPES.includes(file.type)) {
    return { success: false, error: "Envie um PDF, JPG, PNG ou WEBP." };
  }
  if (file.size > MAX_COMPROVANTE_BYTES) {
    return { success: false, error: "Arquivo muito grande (máximo 10MB)." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "pdf";
  const path = `pending/${crypto.randomUUID()}.${extension}`;

  const supabase = createServiceClient();
  const { error } = await supabase.storage
    .from("comprovantes")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { success: false, error: "Não foi possível enviar o arquivo. Tente novamente." };

  return { success: true, path };
}

type UploadImageResult = { success: true; url: string } | { success: false; error: string };

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Foto/logo enviada durante o cadastro (a empresa ainda não existe): vai para `pending/` no bucket público. */
export async function uploadRegistrationImage(formData: FormData): Promise<UploadImageResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { success: false, error: "Selecione uma imagem." };
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return { success: false, error: "Use uma imagem JPG, PNG, WebP ou AVIF." };
  if (file.size > MAX_IMAGE_BYTES) return { success: false, error: "Imagem muito grande (máximo 8MB)." };
  if (!(await withinRateLimit(RATE_LIMITS.registrationUpload))) return { success: false, error: "Muitos envios seguidos. Aguarde alguns minutos." };

  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `pending/${crypto.randomUUID()}.${extension}`;
  const supabase = createServiceClient();
  const { error } = await supabase.storage.from("business-photos").upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { success: false, error: "Não foi possível enviar a imagem." };
  return { success: true, url: supabase.storage.from("business-photos").getPublicUrl(path).data.publicUrl };
}

async function generateUniqueSlug(
  supabase: ReturnType<typeof createServiceClient>,
  name: string
): Promise<string> {
  const base = slugify(name) || "empresa";
  let candidate = base;
  let suffix = 2;
  while (true) {
    const { data } = await supabase.from("businesses").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function registerBusiness(rawInput: RegisterBusinessInput): Promise<RegisterBusinessResult> {
  const parsed = registerBusinessSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const input = parsed.data;

  if (!(await withinRateLimit(RATE_LIMITS.register))) {
    return { success: false, error: "Muitas tentativas de cadastro. Aguarde alguns minutos e tente de novo." };
  }

  const turnstileOk = await verifyTurnstileToken(input.turnstileToken);
  if (!turnstileOk) {
    return { success: false, error: "Não foi possível confirmar que você não é um robô. Tente novamente." };
  }

  const supabase = createServiceClient();
  const passwordHash = await bcrypt.hash(input.password, 10);
  const slug = await generateUniqueSlug(supabase, input.name);

  const { data: business, error } = await supabase
    .from("businesses")
    .insert({
      slug,
      email: input.email.toLowerCase(),
      password_hash: passwordHash,
      name: input.name,
      responsible_name: input.responsibleName,
      document: input.document.trim() || null,
      category: input.category,
      description: input.shortDescription.trim() || null,
      instagram: input.instagram.trim() || null,
      phone: input.phone,
      tower_id: input.towerId,
      floor: input.floor,
      room_number: input.roomNumber,
      logo_url: input.logoUrl.trim() || null,
      cover_photo_url: input.coverPhotoUrl.trim() || null,
      website_url: input.websiteUrl.trim() || null,
      opening_hours: input.openingHours.trim() || null,
      image_usage_authorized: input.imageUsageAuthorized,
      comprovante_path: input.comprovantePath,
      plan: "presenca",
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Já existe um cadastro com esse e-mail." };
    }
    return { success: false, error: "Não foi possível concluir o cadastro. Tente novamente." };
  }

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || null;
  await supabase.from("consent_acceptances").insert(
    (["termos_de_uso", "politica_de_privacidade", "politica_de_cadastro"] as const).map((documentType) => ({
      business_id: business.id,
      document_type: documentType,
      version: CONSENT_VERSION,
      ip,
    }))
  );

  if (input.marketingOptIn) {
    // Consentimento de marketing é opcional e independente dos termos; falha
    // aqui não desfaz o cadastro (só significa que a empresa não entra em campanhas).
    await supabase.from("email_consents").upsert({
      email: input.email.toLowerCase(),
      business_id: business.id,
      source: "cadastro",
      granted_at: new Date().toISOString(),
      revoked_at: null,
    });
  }

  // Indicação é bônus: se falhar, o cadastro já feito não pode ser desfeito.
  try {
    await recordReferral(business.id, (await cookies()).get(REFERRAL_COOKIE)?.value);
  } catch (referralError) {
    console.error("[referrals] falha ao registrar indicação:", referralError);
  }

  // Extras do wizard são bônus: falha aqui não desfaz o cadastro já feito.
  try {
    await applyProfileDraft(supabase, business.id, draftFromPayload(input.profile), input.importedFromGoogle ? "google" : "wizard");
  } catch (profileError) {
    console.error("[register] falha ao gravar o perfil completo:", profileError);
  }

  await translateAndStore("business", business.id, {
    description: input.shortDescription.trim(),
    opening_hours: input.openingHours.trim(),
  });

  return { success: true, businessId: business.id };
}
