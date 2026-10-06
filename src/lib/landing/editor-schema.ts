import { z } from "zod";
import { parseSchedule } from "./hours.ts";
import { SECTION_KEYS, type LandingCapabilities } from "./sections.ts";

/** Texto opcional: aparado, vazio vira null, limite de tamanho. */
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres.`)
    .transform((value) => (value === "" ? null : value))
    .nullable();

/** URL opcional: só https (nada de javascript:, data: ou http solto). */
const httpsUrl = z
  .string()
  .trim()
  .max(500, "Link muito longo.")
  .refine((value) => value === "" || /^https:\/\/[^\s]+$/i.test(value), "Use um link completo começando com https://")
  .transform((value) => (value === "" ? null : value))
  .nullable();

const whatsappPhone = z
  .string()
  .trim()
  .refine((value) => value === "" || (value.replace(/\D/g, "").length >= 10 && value.replace(/\D/g, "").length <= 13), "Informe o WhatsApp com DDD.")
  .transform((value) => (value === "" ? null : value.replace(/\D/g, "")))
  .nullable();

const scheduleField = z
  .unknown()
  .transform((value, ctx) => {
    if (value === null || value === undefined) return null;
    const parsed = parseSchedule(value);
    if (!parsed) ctx.addIssue({ code: "custom", message: "Horário inválido: use faixas como 08:00 às 18:00, com a abertura antes do fechamento." });
    return parsed;
  });

const sectionKey = z.enum(SECTION_KEYS);

export const landingPatchSchema = z
  .object({
    heroHeadline: text(120),
    heroSubtitle: text(280),
    heroImageUrl: httpsUrl,
    heroCtaKind: z.enum(["servicos", "orcamento", "agendar", "cardapio"]),
    heroCtaLabel: text(30),
    whatsappPhone,
    whatsappMessage: text(300),
    aboutProblem: text(400),
    aboutBenefit: text(400),
    aboutDifferentials: z.array(z.string().trim().min(1).max(80)).max(6, "No máximo 6 diferenciais."),
    aboutAudience: text(300),
    yearsInBusiness: z.number().int().min(0).max(200).nullable(),
    responseTime: text(80),
    byAppointment: z.boolean(),
    professionalRegistry: text(80),
    parkingInfo: text(140),
    accessibilityInfo: text(140),
    referencePoint: text(140),
    openingSchedule: scheduleField,
    facebookUrl: httpsUrl,
    tiktokUrl: httpsUrl,
    youtubeUrl: httpsUrl,
    leadFormEnabled: z.boolean(),
    finalCtaTitle: text(120),
    finalCtaText: text(280),
    finalCtaLabel: text(30),
    sectionOrder: z.array(sectionKey).max(SECTION_KEYS.length),
    sectionsDisabled: z.array(sectionKey).max(SECTION_KEYS.length),
    seoTitle: text(70),
    seoDescription: text(160),
  })
  .partial();

export type LandingPatch = z.infer<typeof landingPatchSchema>;

const COLUMN_BY_FIELD: Record<keyof LandingPatch, string> = {
  heroHeadline: "hero_headline",
  heroSubtitle: "hero_subtitle",
  heroImageUrl: "hero_image_url",
  heroCtaKind: "hero_cta_kind",
  heroCtaLabel: "hero_cta_label",
  whatsappPhone: "whatsapp_phone",
  whatsappMessage: "whatsapp_message",
  aboutProblem: "about_problem",
  aboutBenefit: "about_benefit",
  aboutDifferentials: "about_differentials",
  aboutAudience: "about_audience",
  yearsInBusiness: "years_in_business",
  responseTime: "response_time",
  byAppointment: "by_appointment",
  professionalRegistry: "professional_registry",
  parkingInfo: "parking_info",
  accessibilityInfo: "accessibility_info",
  referencePoint: "reference_point",
  openingSchedule: "opening_schedule",
  facebookUrl: "facebook_url",
  tiktokUrl: "tiktok_url",
  youtubeUrl: "youtube_url",
  leadFormEnabled: "lead_form_enabled",
  finalCtaTitle: "final_cta_title",
  finalCtaText: "final_cta_text",
  finalCtaLabel: "final_cta_label",
  sectionOrder: "section_order",
  sectionsDisabled: "sections_disabled",
  seoTitle: "seo_title",
  seoDescription: "seo_description",
};

/** Só os campos enviados viram colunas (um salvamento de aba não apaga o resto da configuração). */
export function patchToRow(patch: LandingPatch): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [field, column] of Object.entries(COLUMN_BY_FIELD)) {
    const value = patch[field as keyof LandingPatch];
    if (value !== undefined) row[column] = value;
  }
  return row;
}

/** Recursos que o plano não inclui não podem ser ligados nem preenchidos. Retorna a mensagem de erro, ou null se estiver tudo certo. */
export function checkPatchAgainstPlan(patch: LandingPatch, capabilities: LandingCapabilities): string | null {
  if (patch.heroImageUrl && !capabilities.customCover) return "A capa personalizada faz parte de um plano superior.";
  if (patch.leadFormEnabled && !capabilities.leadForm) return "O formulário de contato faz parte de um plano superior.";
  return null;
}
