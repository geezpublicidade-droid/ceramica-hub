"use server";

import { logMetricEvent } from "@/lib/services/platform";

/** Loga só o termo (até 80 chars, sem dado sensível) e a origem do disparo. */
export async function logSearchPerformed(term: string, source: "hero" | "smart_search" | "global_overlay") {
  const trimmed = term.trim().slice(0, 80);
  if (!trimmed) return;
  await logMetricEvent("search_performed", undefined, { term: trimmed, source });
}

export async function logWhatsAppClick(businessId: string) {
  await logMetricEvent("whatsapp_clicked", businessId);
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
export async function logContactClick(businessId: string, kind: ContactClickKind) {
  const eventType = CONTACT_CLICK_EVENT[kind];
  if (!eventType) return;
  await logMetricEvent(eventType, businessId);
}
