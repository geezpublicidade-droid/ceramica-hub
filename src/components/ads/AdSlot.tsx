"use client";

import { useEffect, useState } from "react";
import { AdLink } from "@/components/ads/AdLink";
import { Link } from "@/i18n/navigation";
import type { ActiveCampaign } from "@/lib/services/ads";

/** Busca via /api/ads/slot (fora do cache ISR da página) pra sortear de
 * verdade a cada carregamento, em vez de ficar presa ao HTML cacheado por
 * até 60s. Usado em posições simples e contidas, tipo o topo do diretório —
 * o banner de destaque de tela a tela é o AdBanner, componente separado. */
export function AdSlot({ placementKey }: { placementKey: string }) {
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

  // Sem campanha paga pra essa posição -- em vez de deixar o espaço vazio,
  // mostra o próprio anúncio "casa" do Cerâmica Hub vendendo esse espaço.
  if (!campaign) {
    return (
      <div className="mx-auto max-w-6xl px-6">
        <Link
          href="/seja-um-parceiro"
          className="block overflow-hidden border border-border"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/ceramica-hub-anuncie-banner.webp"
            alt="Anuncie aqui — sua marca no coração do Cerâmica"
            className="w-full"
            loading="lazy"
          />
        </Link>
      </div>
    );
  }

  const desktopCreative = campaign.creatives.find((c) => c.device === "desktop");
  const mobileCreative = campaign.creatives.find((c) => c.device === "mobile");
  if (!desktopCreative && !mobileCreative) return null;

  return (
    <div className="mx-auto max-w-6xl px-6">
      <div className="relative overflow-hidden rounded-2xl border border-border">
        <span className="absolute left-3 top-3 z-10 rounded-full bg-black/60 px-2.5 py-1 text-[12px] font-medium uppercase tracking-wide text-white">
          Patrocinado
        </span>
        <AdLink href={campaign.targetUrl} campaignId={campaign.id}>
          {desktopCreative && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={desktopCreative.imageUrl} alt={desktopCreative.altText} className="hidden w-full sm:block" />
          )}
          {mobileCreative && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mobileCreative.imageUrl} alt={mobileCreative.altText} className="block w-full sm:hidden" />
          )}
        </AdLink>
      </div>
    </div>
  );
}
