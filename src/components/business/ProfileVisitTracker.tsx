"use client";

import { useEffect } from "react";
import { logCommercialPageView, logPlacementProfileView } from "@/lib/actions/log-search";
import { isPlacementId, markCountedThisSession, rememberPlacement } from "@/lib/placement-attribution";
import { utmSourceFromSearch } from "@/lib/share-links";
import { categoryFromReferrer, utmCampaignFromSearch } from "@/lib/landing/origin";
import { track } from "@/lib/analytics";

/**
 * Montado no perfil da empresa. Conta a visita uma vez por sessão e, se ela veio de um card
 * patrocinado (`?pl=`), credita também a posição. Roda no navegador porque o perfil é ISR (cache
 * de 60s): um log no servidor só dispararia a cada regeneração, e robôs sem JS não contam.
 */
export function ProfileVisitTracker({ businessId, name, category }: { businessId: string; name: string; category: string }) {
  useEffect(() => {
    if (markCountedThisSession(`profile:${businessId}`)) {
      track({ name: "view_profile", businessName: name, category });
      // utm_source do link rastreado (instagram, facebook, google...); sem UTM, a origem fica vazia
      void logCommercialPageView(businessId, utmSourceFromSearch(window.location.search) || undefined, {
        campaign: utmCampaignFromSearch(window.location.search) || undefined,
        fromCategory: categoryFromReferrer(document.referrer, window.location.hostname) ?? undefined,
      }).catch(() => undefined);
    }

    const placementId = new URLSearchParams(window.location.search).get("pl");
    if (!isPlacementId(placementId)) return;
    rememberPlacement(businessId, placementId);
    if (markCountedThisSession(`placement:${placementId}`)) {
      void logPlacementProfileView(placementId, businessId).catch(() => undefined);
    }
  }, [businessId, name, category]);
  return null;
}
