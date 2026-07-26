"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import { translateAndStore } from "@/lib/services/translate";
import { verifyTurnstileToken } from "@/lib/services/turnstile";

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
    services: z.array(z.object({ name: z.string(), description: z.string() })).max(3),
    termsAccepted: z.boolean(),
    privacyAccepted: z.boolean(),
    registrationPolicyAccepted: z.boolean(),
    imageUsageAuthorized: z.boolean(),
    addressConfirmed: z.boolean(),
    turnstileToken: z.string().nullable().optional(),
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

  await translateAndStore("business", business.id, {
    description: input.shortDescription.trim(),
    opening_hours: input.openingHours.trim(),
  });

  const services = input.services.filter((s) => s.name.trim()).slice(0, 3);
  if (services.length > 0) {
    const { data: insertedServices } = await supabase
      .from("business_services")
      .insert(
        services.map((s, index) => ({
          business_id: business.id,
          name: s.name.trim(),
          description: s.description.trim() || null,
          sort_order: index,
        }))
      )
      .select("id, name, description");

    await Promise.all(
      (insertedServices ?? []).map((service) =>
        translateAndStore("business_service", service.id, {
          name: service.name,
          description: service.description,
        })
      )
    );
  }

  return { success: true, businessId: business.id };
}
