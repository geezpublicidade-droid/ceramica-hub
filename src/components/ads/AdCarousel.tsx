"use client";

import { useEffect, useState } from "react";
import { AdCarouselTrack } from "@/components/ads/AdCarouselTrack";
import type { ActiveCampaign } from "@/lib/services/ads";

/**
 * Carrossel horizontal com todos os anunciantes ativos pra essa posição ao
 * mesmo tempo (diferente do AdSlot, que sorteia só um) -- vitrine de vários
 * pagantes. Busca via /api/ads/carousel, fora do cache ISR da página, pelo
 * mesmo motivo do AdSlot (ver comentário lá).
 */
export function AdCarousel({ placementKey }: { placementKey: string }) {
  const [campaigns, setCampaigns] = useState<ActiveCampaign[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ads/carousel?placement=${encodeURIComponent(placementKey)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setCampaigns(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [placementKey]);

  if (campaigns.length === 0) return null;
  return <AdCarouselTrack campaigns={campaigns} />;
}
