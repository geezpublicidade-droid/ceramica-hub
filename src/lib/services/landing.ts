import { createServiceClient } from "@/lib/supabase/server";
import type { Business, BusinessService } from "@/data/businesses";
import { getBusinessPhotos, getBusinessServices, type OwnedPhoto } from "@/lib/services/platform";
import { getApprovedReviews, getReviewStats, type BusinessReview } from "@/lib/services/reviews";
import { SECTIONS_BY_LAYOUT, landingCapabilitiesFromFeatures, resolveSectionOrder, type LandingCapabilities, type SectionKey } from "@/lib/landing/sections";
import { getCompanyPermissions } from "@/lib/services/company-plan";
import { loadPlanCatalog } from "@/lib/services/plan-catalog";
import { publishedItems } from "@/lib/plans/resolve";
import type { FeatureMap } from "@/lib/plans/features";
import { gateLandingConfig } from "@/lib/landing/gate";
import { parseSchedule, type OpeningSchedule } from "@/lib/landing/hours";
import { applyDemoContent } from "@/lib/landing/demo";

export type HeroCtaKind = "servicos" | "orcamento" | "agendar" | "cardapio";

export type LandingConfig = {
  status: "draft" | "published";
  heroHeadline: string | null;
  heroSubtitle: string | null;
  heroImageUrl: string | null;
  heroCtaKind: HeroCtaKind;
  heroCtaLabel: string | null;
  whatsappPhone: string | null;
  whatsappMessage: string | null;
  aboutProblem: string | null;
  aboutBenefit: string | null;
  aboutDifferentials: string[];
  aboutAudience: string | null;
  yearsInBusiness: number | null;
  responseTime: string | null;
  byAppointment: boolean;
  professionalRegistry: string | null;
  parkingInfo: string | null;
  accessibilityInfo: string | null;
  referencePoint: string | null;
  openingSchedule: OpeningSchedule | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  leadFormEnabled: boolean;
  finalCtaTitle: string | null;
  finalCtaText: string | null;
  finalCtaLabel: string | null;
  sectionOrder: string[];
  sectionsDisabled: string[];
  seoTitle: string | null;
  seoDescription: string | null;
};

export type LandingFaq = { id: string; question: string; answer: string };

export type LandingOffer = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  ctaLabel: string | null;
  couponCode: string | null;
  validUntil: string | null;
};

export type LandingData = {
  config: LandingConfig;
  capabilities: LandingCapabilities;
  sections: SectionKey[];
  services: BusinessService[];
  hasMoreServices: boolean;
  faqs: LandingFaq[];
  /** a promoção em destaque (a mais recente publicada) */
  offer: LandingOffer | null;
  /** todas as promoções publicadas, até o limite do plano (a primeira é o `offer`) */
  offers: LandingOffer[];
  /** mapa de recursos que valeu para montar esta página (plano em vigor + overrides) */
  features: FeatureMap;
  gallery: OwnedPhoto[];
  videos: OwnedPhoto[];
  reviews: BusinessReview[];
  reviewStats: { average: number; count: number };
};

const EMPTY_CONFIG: LandingConfig = {
  status: "published",
  heroHeadline: null,
  heroSubtitle: null,
  heroImageUrl: null,
  heroCtaKind: "servicos",
  heroCtaLabel: null,
  whatsappPhone: null,
  whatsappMessage: null,
  aboutProblem: null,
  aboutBenefit: null,
  aboutDifferentials: [],
  aboutAudience: null,
  yearsInBusiness: null,
  responseTime: null,
  byAppointment: false,
  professionalRegistry: null,
  parkingInfo: null,
  accessibilityInfo: null,
  referencePoint: null,
  openingSchedule: null,
  facebookUrl: null,
  tiktokUrl: null,
  youtubeUrl: null,
  leadFormEnabled: false,
  finalCtaTitle: null,
  finalCtaText: null,
  finalCtaLabel: null,
  sectionOrder: [],
  sectionsDisabled: [],
  seoTitle: null,
  seoDescription: null,
};

type LandingRow = Record<string, unknown>;

const text = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value.trim() : null);

function mapConfig(row: LandingRow): LandingConfig {
  const kind = row.hero_cta_kind;
  return {
    status: row.status === "draft" ? "draft" : "published",
    heroHeadline: text(row.hero_headline),
    heroSubtitle: text(row.hero_subtitle),
    heroImageUrl: text(row.hero_image_url),
    heroCtaKind: kind === "orcamento" || kind === "agendar" || kind === "cardapio" ? kind : "servicos",
    heroCtaLabel: text(row.hero_cta_label),
    whatsappPhone: text(row.whatsapp_phone),
    whatsappMessage: text(row.whatsapp_message),
    aboutProblem: text(row.about_problem),
    aboutBenefit: text(row.about_benefit),
    aboutDifferentials: Array.isArray(row.about_differentials) ? (row.about_differentials as unknown[]).map(text).filter((v): v is string => Boolean(v)) : [],
    aboutAudience: text(row.about_audience),
    yearsInBusiness: typeof row.years_in_business === "number" ? row.years_in_business : null,
    responseTime: text(row.response_time),
    byAppointment: row.by_appointment === true,
    professionalRegistry: text(row.professional_registry),
    parkingInfo: text(row.parking_info),
    accessibilityInfo: text(row.accessibility_info),
    referencePoint: text(row.reference_point),
    openingSchedule: parseSchedule(row.opening_schedule),
    facebookUrl: text(row.facebook_url),
    tiktokUrl: text(row.tiktok_url),
    youtubeUrl: text(row.youtube_url),
    leadFormEnabled: row.lead_form_enabled === true,
    finalCtaTitle: text(row.final_cta_title),
    finalCtaText: text(row.final_cta_text),
    finalCtaLabel: text(row.final_cta_label),
    sectionOrder: Array.isArray(row.section_order) ? (row.section_order as string[]) : [],
    sectionsDisabled: Array.isArray(row.sections_disabled) ? (row.sections_disabled as string[]) : [],
    seoTitle: text(row.seo_title),
    seoDescription: text(row.seo_description),
  };
}

/** Só a configuração (metadata/SEO); `getLandingData` carrega o resto. */
export async function getLandingConfig(businessId: string): Promise<LandingConfig> {
  return loadConfig(businessId);
}

async function loadConfig(businessId: string): Promise<LandingConfig> {
  const { data, error } = await createServiceClient().from("business_landing").select("*").eq("business_id", businessId).maybeSingle();
  if (error) {
    // tabela ainda não migrada ou falha de leitura: a página cai no conteúdo básico, nunca quebra
    console.error("[landing] falha ao ler business_landing:", error.message);
    return EMPTY_CONFIG;
  }
  return data ? mapConfig(data) : EMPTY_CONFIG;
}

async function loadFaqs(businessId: string): Promise<LandingFaq[]> {
  const { data, error } = await createServiceClient()
    .from("business_faqs")
    .select("id, question, answer")
    .eq("business_id", businessId)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) return [];
  return (data ?? []).map((row) => ({ id: row.id, question: row.question, answer: row.answer }));
}

/** Promoções ativas e dentro da validade, da mais recente para a mais antiga, até o limite do plano. */
async function loadOffers(businessId: string, limit: number): Promise<LandingOffer[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await createServiceClient()
    .from("benefits")
    .select("id, title, description, image_url, cta_label, coupon_code, valid_until")
    .eq("business_id", businessId)
    .eq("active", true)
    .or(`valid_until.is.null,valid_until.gte.${today}`)
    .order("created_at", { ascending: false })
    .limit(Number.isFinite(limit) ? Math.max(0, limit) : 12);
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    imageUrl: text(row.image_url),
    ctaLabel: text(row.cta_label),
    couponCode: text(row.coupon_code),
    validUntil: text(row.valid_until),
  }));
}

async function loadReviews(businessId: string) {
  try {
    const [reviews, reviewStats] = await Promise.all([getApprovedReviews(businessId), getReviewStats(businessId)]);
    return { reviews, reviewStats };
  } catch {
    return { reviews: [], reviewStats: { average: 0, count: 0 } };
  }
}

/** Sem cupom rastreável no plano, a promoção aparece sem o código. */
function couponGate(offers: LandingOffer[], capabilities: LandingCapabilities): LandingOffer[] {
  return capabilities.trackableCoupons ? offers : offers.map((offer) => ({ ...offer, couponCode: null }));
}

/** Recursos que valem para esta página: os da empresa (plano em vigor + overrides) ou, na simulação, os de fábrica/admin do plano escolhido. */
async function featuresFor(business: Business, simulatePlan?: Business["plan"]): Promise<FeatureMap> {
  if (simulatePlan) return (await loadPlanCatalog()).features[simulatePlan];
  const permissions = await getCompanyPermissions(business.id);
  if (permissions) return permissions.features;
  return (await loadPlanCatalog()).features[business.effectivePlan];
}

/**
 * Tudo que a landing pública precisa, já filtrado pelo plano da empresa. Rascunho: o público vê só o conteúdo
 * básico (a configuração é ignorada); a empresa e o admin veem o rascunho no preview do painel (`allowDraft`).
 */
export async function getLandingData(
  business: Business,
  options: { locale?: string; allowDraft?: boolean; simulatePlan?: Business["plan"]; demoContent?: boolean } = {},
): Promise<LandingData> {
  const stored = await loadConfig(business.id);
  const features = await featuresFor(business, options.simulatePlan);
  const capabilities = landingCapabilitiesFromFeatures(features);
  // rascunho: o público vê só o básico; o plano em vigor esconde (sem apagar) o que a configuração salva não pode mais mostrar
  const config = gateLandingConfig(stored.status === "draft" && !options.allowDraft ? EMPTY_CONFIG : stored, capabilities);

  const [allServices, allPhotos, faqs, offers, reviewData] = await Promise.all([
    getBusinessServices(business.id, options.locale),
    getBusinessPhotos(business.id),
    capabilities.faq ? loadFaqs(business.id) : Promise.resolve([]),
    capabilities.offer ? loadOffers(business.id, capabilities.maxPromotions) : Promise.resolve([] as LandingOffer[]),
    loadReviews(business.id),
  ]);

  // Downgrade nunca apaga: só os itens ATIVOS, até o limite do plano, ficam publicados; o resto continua salvo
  const services = publishedItems(allServices, capabilities.maxServices);
  const media = capabilities.gallery ? publishedItems(allPhotos, Infinity) : [];

  const data: LandingData = {
    config,
    capabilities,
    sections: resolveSectionOrder(config.sectionOrder, config.sectionsDisabled, SECTIONS_BY_LAYOUT[capabilities.layout]),
    services,
    hasMoreServices: services.length > 6,
    faqs,
    // cupom rastreável só aparece se o plano incluir
    offer: offers.length > 0 ? couponGate(offers, capabilities)[0] : null,
    offers: couponGate(offers, capabilities),
    features,
    gallery: publishedItems(media.filter((item) => item.kind === "photo"), capabilities.maxGalleryItems),
    videos: capabilities.video ? publishedItems(media.filter((item) => item.kind === "video"), capabilities.maxVideos) : [],
    ...reviewData,
  };

  if (!options.demoContent) return data;
  const ownImages = [business.coverPhoto, ...allPhotos.filter((item) => item.kind === "photo").map((item) => item.url)].filter((url): url is string => Boolean(url));
  return applyDemoContent(data, { business, ownImages });
}
