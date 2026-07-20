"use server";

import { logMetricEvent } from "@/lib/services/platform";

/** Loga só o termo (até 80 chars, sem dado sensível) e a origem do disparo. */
export async function logSearchPerformed(term: string, source: "hero" | "smart_search") {
  const trimmed = term.trim().slice(0, 80);
  if (!trimmed) return;
  await logMetricEvent("search_performed", undefined, { term: trimmed, source });
}

export async function logWhatsAppClick(businessId: string) {
  await logMetricEvent("whatsapp_clicked", businessId);
}
