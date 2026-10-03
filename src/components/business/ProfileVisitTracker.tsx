"use client";

import { useEffect } from "react";
import { logCommercialPageView, logPlacementProfileView } from "@/lib/actions/log-search";
import { isPlacementId, markCountedThisSession, rememberPlacement } from "@/lib/placement-attribution";

/**
 * Montado no perfil da empresa. Conta a visita uma vez por sessão e, se ela veio de um card
 * patrocinado (`?pl=`), credita também a posição. Roda no navegador porque o perfil é ISR (cache
 * de 60s): um log no servidor só dispararia a cada regeneração, e robôs sem JS não contam.
 */
export function ProfileVisitTracker({ businessId }: { businessId: string }) {
  useEffect(() => {
    if (markCountedThisSession(`profile:${businessId}`)) {
      void logCommercialPageView(businessId).catch(() => undefined);
    }

    const placementId = new URLSearchParams(window.location.search).get("pl");
    if (!isPlacementId(placementId)) return;
    rememberPlacement(businessId, placementId);
    if (markCountedThisSession(`placement:${placementId}`)) {
      void logPlacementProfileView(placementId, businessId).catch(() => undefined);
    }
  }, [businessId]);
  return null;
}
