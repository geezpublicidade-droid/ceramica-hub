import { createServiceClient } from "@/lib/supabase/server";
import type { Business, BusinessService } from "@/data/businesses";
import { getBusinessPhotos, getBusinessServices, type OwnedPhoto } from "@/lib/services/platform";
import { getLandingConfig, type LandingConfig } from "@/lib/services/landing";
import { landingCapabilitiesFromFeatures, type LandingCapabilities } from "@/lib/landing/sections";
import { getCompanyPermissions } from "@/lib/services/company-plan";
import { loadPlanCatalog } from "@/lib/services/plan-catalog";
import type { ReviewStatus } from "@/lib/services/reviews";

import { LEAD_STATUSES, type LeadStatus } from "@/lib/landing/leads";

export type EditorFaq = { id: string; question: string; answer: string; active: boolean };
export type EditorOffer = { id: string; title: string; description: string; couponCode: string | null; validUntil: string | null; active: boolean; imageUrl: string | null; ctaLabel: string | null };
export type EditorReview = { id: string; name: string; rating: number; comment: string; status: ReviewStatus; createdAt: string };
export type BusinessLead = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  serviceName: string | null;
  message: string | null;
  status: LeadStatus;
  source: string | null;
  device: string | null;
  notes: string | null;
  createdAt: string;
};

export type LandingEditorData = {
  business: Business;
  capabilities: LandingCapabilities;
  config: LandingConfig;
  faqs: EditorFaq[];
  services: BusinessService[];
  media: OwnedPhoto[];
  offers: EditorOffer[];
  reviews: EditorReview[];
  leadCounts: Record<LeadStatus, number>;
};

async function loadFaqs(businessId: string): Promise<EditorFaq[]> {
  const { data } = await createServiceClient().from("business_faqs").select("id, question, answer, active").eq("business_id", businessId).order("sort_order");
  return (data ?? []).map((row) => ({ id: row.id, question: row.question, answer: row.answer, active: row.active }));
}

async function loadOffers(businessId: string): Promise<EditorOffer[]> {
  const { data } = await createServiceClient()
    .from("benefits")
    .select("id, title, description, coupon_code, valid_until, active, image_url, cta_label")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    couponCode: row.coupon_code ?? null,
    validUntil: row.valid_until ?? null,
    active: row.active,
    imageUrl: row.image_url ?? null,
    ctaLabel: row.cta_label ?? null,
  }));
}

async function loadReviews(businessId: string): Promise<EditorReview[]> {
  const { data } = await createServiceClient()
    .from("business_reviews")
    .select("id, rating, comment, status, created_at, members(name)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []).map((row) => ({
    id: row.id,
    name: (row.members as unknown as { name: string } | null)?.name?.split(" ")[0] ?? "Membro",
    rating: row.rating,
    comment: row.comment,
    status: row.status as ReviewStatus,
    createdAt: row.created_at,
  }));
}

async function loadLeadCounts(businessId: string): Promise<Record<LeadStatus, number>> {
  const counts = Object.fromEntries(LEAD_STATUSES.map((status) => [status, 0])) as Record<LeadStatus, number>;
  const { data } = await createServiceClient().from("business_leads").select("status").eq("business_id", businessId);
  for (const row of data ?? []) counts[row.status as LeadStatus] += 1;
  return counts;
}

/** Tudo que o editor precisa, sem filtrar rascunho, itens ocultos nem pendentes de moderação. */
export async function getLandingEditorData(business: Business): Promise<LandingEditorData> {
  const [config, faqs, services, media, offers, reviews, leadCounts, permissions, catalog] = await Promise.all([
    getLandingConfig(business.id),
    loadFaqs(business.id),
    getBusinessServices(business.id),
    getBusinessPhotos(business.id),
    loadOffers(business.id),
    loadReviews(business.id),
    loadLeadCounts(business.id),
    getCompanyPermissions(business.id),
    loadPlanCatalog(),
  ]);
  // recursos em vigor (plano + overrides + edições do admin no catálogo); sem eles, o plano em vigor do cache
  const features = permissions?.features ?? catalog.features[business.effectivePlan];
  return { business, capabilities: landingCapabilitiesFromFeatures(features), config, faqs, services, media, offers, reviews, leadCounts };
}

export async function listBusinessLeads(businessId: string, limit = 100): Promise<BusinessLead[]> {
  const { data } = await createServiceClient()
    .from("business_leads")
    .select("id, name, phone, email, service_name, message, status, source, device, notes, created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    serviceName: row.service_name,
    message: row.message,
    status: row.status as LeadStatus,
    source: row.source,
    device: row.device,
    notes: row.notes,
    createdAt: row.created_at,
  }));
}
