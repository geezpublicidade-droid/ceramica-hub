"use client";

import { useEffect, useState } from "react";
import { AdLink } from "@/components/ads/AdLink";
import type { ActiveCampaign } from "@/lib/services/ads";

/** `fullBleed`: ocupa a largura inteira da viewport, sem cantos arredondados nem
 * container — pensado pra posições de destaque tipo banner logo abaixo do hero.
 * Busca via /api/ads/slot (fora do cache ISR da página) pra sortear de verdade
 * a cada carregamento, em vez de ficar presa ao HTML cacheado por até 60s. */
export function AdSlot({ placementKey, fullBleed = false }: { placementKey: string; fullBleed?: boolean }) {
  const [campaign, setCampaign] = useState<ActiveCampaign | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ads/slot?placement=${encodeURIComponent(placementKey)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setCampaign(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [placementKey]);

  if (!campaign) return null;

  const desktopCreative = campaign.creatives.find((c) => c.device === "desktop");
  const mobileCreative = campaign.creatives.find((c) => c.device === "mobile");
  if (!desktopCreative && !mobileCreative) return null;

  const imageClass = fullBleed ? "h-64 w-full object-cover sm:h-80 md:h-[420px]" : "w-full";

  return (
    <div className={fullBleed ? "w-full" : "mx-auto max-w-6xl px-6"}>
      <div className={`relative overflow-hidden ${fullBleed ? "" : "rounded-2xl border border-border"}`}>
        <span className="absolute left-3 top-3 z-10 rounded-full bg-black/60 px-2.5 py-1 text-[12px] font-medium uppercase tracking-wide text-white">
          Patrocinado
        </span>
        <AdLink href={campaign.targetUrl} campaignId={campaign.id}>
          {desktopCreative && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={desktopCreative.imageUrl} alt={desktopCreative.altText} className={`hidden sm:block ${imageClass}`} />
          )}
          {mobileCreative && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mobileCreative.imageUrl} alt={mobileCreative.altText} className={`block sm:hidden ${imageClass}`} />
          )}
        </AdLink>
      </div>
    </div>
  );
}
