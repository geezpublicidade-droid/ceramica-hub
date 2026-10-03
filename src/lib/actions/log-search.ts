"use server";

import { headers } from "next/headers";
import { logMetricEvent } from "@/lib/services/platform";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Loga só o termo (até 80 chars, sem dado sensível) e a origem do disparo. */
export async function logSearchPerformed(term: string, source: "hero" | "smart_search" | "global_overlay") {
  const trimmed = term.trim().slice(0, 80);
  if (!trimmed) return;
  await logMetricEvent("search_performed", undefined, { term: trimmed, source });
}

/** Metadata de atribuição a uma posição paga; id inválido vira "sem atribuição". */
function attribution(placementId: string | undefined): Record<string, unknown> | undefined {
  return placementId && UUID_RE.test(placementId) ? { placementId } : undefined;
}

export async function logWhatsAppClick(businessId: string, placementId?: string) {
  await logMetricEvent("whatsapp_clicked", businessId, attribution(placementId));
}

export async function logAdClick(campaignId: string) {
  await logMetricEvent("ad_click", undefined, { campaignId });
}

export async function logEventInterest(eventId: string) {
  await logMetricEvent("event_interest_clicked", undefined, { eventId });
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
  await logMetricEvent(eventType, businessId, attribution(placementId));
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
    await logMetricEvent("portal_page_viewed", undefined, { path: cleanPath, source });
  } catch {
    // métrica nunca pode quebrar a navegação
  }
}

const PLACEMENT_CLICK_KINDS = ["profile", "whatsapp"] as const;

/** Card de posição comercial entrou na tela (uma vez por visualização de página). */
export async function logPlacementImpression(placementId: string, businessId: string) {
  if (!UUID_RE.test(placementId) || !UUID_RE.test(businessId)) return;
  await logMetricEvent("placement_impression", businessId, { placementId });
}

export async function logPlacementClick(placementId: string, businessId: string, kind: (typeof PLACEMENT_CLICK_KINDS)[number]) {
  if (!UUID_RE.test(placementId) || !UUID_RE.test(businessId) || !PLACEMENT_CLICK_KINDS.includes(kind)) return;
  await logMetricEvent("placement_click", businessId, { placementId, kind });
}

/** Visita ao perfil comercial da empresa (chamada pelo navegador, uma vez por sessão). */
export async function logCommercialPageView(businessId: string) {
  if (!UUID_RE.test(businessId)) return;
  await logMetricEvent("commercial_page_viewed", businessId);
}

export async function logPlacementProfileView(placementId: string, businessId: string) {
  if (!UUID_RE.test(placementId) || !UUID_RE.test(businessId)) return;
  await logMetricEvent("placement_profile_view", businessId, { placementId });
}
