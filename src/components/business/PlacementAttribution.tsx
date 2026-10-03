"use client";

import { useEffect } from "react";
import { logPlacementProfileView } from "@/lib/actions/log-search";
import { isPlacementId, markProfileViewCounted, rememberPlacement } from "@/lib/placement-attribution";

/**
 * Montado no perfil da empresa: se a visita veio de um card patrocinado (`?pl=`), registra a
 * visualização do perfil atribuída à posição. Fica no cliente porque o perfil é ISR (cache de 60s).
 */
export function PlacementAttribution({ businessId }: { businessId: string }) {
  useEffect(() => {
    const placementId = new URLSearchParams(window.location.search).get("pl");
    if (!isPlacementId(placementId)) return;
    rememberPlacement(businessId, placementId);
    if (!markProfileViewCounted(placementId)) return;
    void logPlacementProfileView(placementId, businessId).catch(() => undefined);
  }, [businessId]);
  return null;
}
