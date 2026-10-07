"use server";

import { headers } from "next/headers";
import { logMetricEvent } from "@/lib/services/platform";
import { createServiceClient } from "@/lib/supabase/server";
import { RATE_LIMITS, withinRateLimit } from "@/lib/services/rate-limit";
import { deviceFromUserAgent } from "@/lib/landing/origin";

/** Ações públicas de métrica: acima do limite por IP o evento é descartado em silêncio (não vira erro na tela). */
async function logPublicMetric(...args: Parameters<typeof logMetricEvent>): Promise<void> {
  if (!(await withinRateLimit(RATE_LIMITS.metricLog))) return;
  await logMetricEvent(...args);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Loga só o termo (até 80 chars, sem dado sensível) e a origem do disparo. */
export async function logSearchPerformed(term: string, source: "hero" | "smart_search" | "global_overlay") {
  const trimmed = term.trim().slice(0, 80);
  if (!trimmed) return;
  await logPublicMetric("search_performed", undefined, { term: trimmed, source });
}

/** Metadata de atribuição a uma posição paga; id inválido vira "sem atribuição". */
function attribution(placementId: string | undefined): Record<string, unknown> | undefined {
  return placementId && UUID_RE.test(placementId) ? { placementId } : undefined;
}

export async function logWhatsAppClick(businessId: string, placementId?: string) {
  await logPublicMetric("whatsapp_clicked", businessId, attribution(placementId));
}

export async function logAdClick(campaignId: string) {
  await logPublicMetric("ad_click", undefined, { campaignId });
}

export async function logEventInterest(eventId: string) {
  await logPublicMetric("event_interest_clicked", undefined, { eventId });
}

const CONTACT_CLICK_EVENT = {
  phone: "phone_clicked",
  website: "website_clicked",
  directions: "directions_clicked",
} as const;

export type ContactClickKind = keyof typeof CONTACT_CLICK_EVENT;

/** Clique em telefone, site ou rota da página da empresa (WhatsApp tem ação própria, logWhatsAppClick). */
export async function logContactClick(businessId: string, kind: ContactClickKind, placementId?: string) {
  const eventType = CONTACT_CLICK_EVENT[kind];
  if (!eventType) return;
  await logPublicMetric(eventType, businessId, attribution(placementId));
}

const LOCALE_PREFIX = /^\/(pt|en|es|zh)(?=\/|$)/;

/** Host do referrer sem "www." (ex.: "google.com"); vazio quando o acesso é direto ou interno. */
function referrerHost(referrer: string, ownHost: string | null): string | null {
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    return host && host !== ownHost ? host : null;
  } catch {
    return null;
  }
}

/**
 * Visita ao portal. Só guarda caminho (sem locale nem query) e origem
 * (utm_source > host do referrer > "direto"): nenhum IP ou identificador de pessoa.
 */
export async function logPortalPageView(path: string, referrer: string, utmSource: string) {
  const cleanPath = path.split("?")[0].replace(LOCALE_PREFIX, "") || "/";
  if (!cleanPath.startsWith("/") || cleanPath.length > 200) return;
  const ownHost = (await headers()).get("host")?.replace(/^www\./, "") ?? null;
  const source = utmSource.trim().toLowerCase().slice(0, 40) || referrerHost(referrer, ownHost) || "direto";
  try {
    await logPublicMetric("portal_page_viewed", undefined, { path: cleanPath, source });
  } catch {
    // métrica nunca pode quebrar a navegação
  }
}

const PLACEMENT_CLICK_KINDS = ["profile", "whatsapp"] as const;

/** Card de posição comercial entrou na tela (uma vez por visualização de página). */
export async function logPlacementImpression(placementId: string, businessId: string) {
  if (!UUID_RE.test(placementId) || !UUID_RE.test(businessId)) return;
  await logPublicMetric("placement_impression", businessId, { placementId });
}

export async function logPlacementClick(placementId: string, businessId: string, kind: (typeof PLACEMENT_CLICK_KINDS)[number]) {
  if (!UUID_RE.test(placementId) || !UUID_RE.test(businessId) || !PLACEMENT_CLICK_KINDS.includes(kind)) return;
  await logPublicMetric("placement_click", businessId, { placementId, kind });
}

/** Visita ao perfil comercial da empresa (chamada pelo navegador, uma vez por sessão). */
export async function logCommercialPageView(businessId: string, source?: string, extra?: { campaign?: string; fromCategory?: string }) {
  if (!UUID_RE.test(businessId)) return;
  const cleanSource = source?.trim().toLowerCase().slice(0, 40);
  const campaign = extra?.campaign?.trim().toLowerCase().slice(0, 60);
  const fromCategory = extra?.fromCategory?.trim().toLowerCase().slice(0, 60);
  const device = deviceFromUserAgent((await headers()).get("user-agent"));
  await logPublicMetric("commercial_page_viewed", businessId, {
    device,
    ...(cleanSource ? { source: cleanSource } : {}),
    ...(campaign ? { campaign } : {}),
    ...(fromCategory ? { fromCategory } : {}),
  });
}

export async function logPlacementProfileView(placementId: string, businessId: string) {
  if (!UUID_RE.test(placementId) || !UUID_RE.test(businessId)) return;
  await logPublicMetric("placement_profile_view", businessId, { placementId });
}

const LANDING_EVENTS = ["service_clicked", "offer_clicked", "gallery_viewed", "video_played"] as const;
export type LandingEvent = (typeof LANDING_EVENTS)[number];

/** Interações da landing da empresa (clique em serviço/oferta, abertura de galeria/vídeo). `itemId` é o serviço/oferta/mídia. */
export async function logLandingEvent(businessId: string, event: LandingEvent, itemId?: string) {
  if (!UUID_RE.test(businessId) || !LANDING_EVENTS.includes(event)) return;
  await logPublicMetric(event, businessId, itemId && UUID_RE.test(itemId) ? { itemId } : undefined);
}

export type ListingEntry = { businessId: string; position: number; plan: string };
export type ListingContextInput = { origin: "empresas" | "categoria" | "busca"; category?: string; query?: string };

const LISTING_ORIGINS = ["empresas", "categoria", "busca"] as const;

function cleanListingBatch(entries: ListingEntry[], context: ListingContextInput) {
  if (!LISTING_ORIGINS.includes(context.origin)) return [];
  const category = context.category?.trim().toLowerCase().slice(0, 80) || null;
  const query = context.query?.trim().toLowerCase().slice(0, 60) || null;
  return entries
    .slice(0, 30)
    .filter((entry) => UUID_RE.test(entry.businessId) && Number.isInteger(entry.position) && entry.position > 0 && entry.position < 10000)
    .map((entry) => ({
      business_id: entry.businessId,
      metadata: { position: entry.position, plan: entry.plan.slice(0, 40), category, origin: context.origin, query },
    }));
}

/** Impressões de empresas nas listagens (posição, plano, categoria, origem e termo da busca). Lote de até 30 cartões visíveis. */
export async function logListingImpressions(entries: ListingEntry[], context: ListingContextInput) {
  const rows = cleanListingBatch(entries, context).map((row) => ({ ...row, event_type: "listing_impression" }));
  if (rows.length === 0 || !(await withinRateLimit(RATE_LIMITS.metricLog))) return;
  await createServiceClient().from("metrics_events").insert(rows);
}

/** Clique em um cartão da listagem (com a posição em que ele estava). */
export async function logListingClick(entry: ListingEntry, context: ListingContextInput) {
  const rows = cleanListingBatch([entry], context).map((row) => ({ ...row, event_type: "listing_click" }));
  if (rows.length === 0 || !(await withinRateLimit(RATE_LIMITS.metricLog))) return;
  await createServiceClient().from("metrics_events").insert(rows);
}
