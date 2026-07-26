"use client";

import { useEffect, useState } from "react";
import { AdLink } from "@/components/ads/AdLink";
import type { ActiveCampaign } from "@/lib/services/ads";

/**
 * Banner de destaque de tela a tela: imagem de um lado, título + descrição
 * do outro -- fica "maior"/mais rico que só a imagem sozinha. Busca via
 * /api/ads/carousel (mesmo endpoint do carrossel, já devolve todas as
 * campanhas elegíveis) e sorteia qual mostrar primeiro; setas deixam o
 * visitante passar manualmente pelas outras.
 */
export function AdBanner({ placementKey }: { placementKey: string }) {
  const [campaigns, setCampaigns] = useState<ActiveCampaign[]>([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ads/carousel?placement=${encodeURIComponent(placementKey)}`)
      .then((res) => res.json())
      .then((data: ActiveCampaign[]) => {
        if (cancelled || !Array.isArray(data) || data.length === 0) return;
        setCampaigns(data);
        setIndex(Math.floor(Math.random() * data.length));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [placementKey]);

  function go(direction: 1 | -1) {
    setVisible(false);
    setTimeout(() => {
      setIndex((prev) => (prev + direction + campaigns.length) % campaigns.length);
      setVisible(true);
    }, 200);
  }

  if (campaigns.length === 0) return null;
  const campaign = campaigns[index];
  const image = campaign.creatives.find((c) => c.device === "desktop") ?? campaign.creatives[0];
  if (!image) return null;

  return (
    <div className="relative flex h-[420px] w-full flex-col overflow-hidden bg-foreground sm:h-[440px] sm:flex-row md:h-[480px]">
      <span className="absolute left-4 top-4 z-10 rounded-full bg-black/60 px-2.5 py-1 text-[12px] font-medium uppercase tracking-wide text-white">
        Patrocinado
      </span>

      <div
        className={`relative flex h-1/2 w-full items-center justify-center overflow-hidden transition-all duration-200 sm:h-full sm:w-3/5 ${
          visible ? "opacity-100 blur-0" : "opacity-0 blur-md"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.imageUrl} alt={image.altText} className="h-full w-full object-cover" />

        {campaigns.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Anúncio anterior"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white/90 p-2.5 shadow-[0_4px_14px_rgba(0,0,0,0.2)] transition hover:bg-white"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Próximo anúncio"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white/90 p-2.5 shadow-[0_4px_14px_rgba(0,0,0,0.2)] transition hover:bg-white"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </>
        )}
      </div>

      <div
        className={`flex h-1/2 w-full flex-col justify-center gap-4 bg-white px-8 py-8 transition-all duration-200 sm:h-full sm:w-2/5 sm:px-10 ${
          visible ? "opacity-100 blur-0" : "opacity-0 blur-md"
        }`}
      >
        <h3 className="text-[clamp(1.4rem,2.5vw,2rem)] font-semibold leading-tight tracking-tight text-foreground">
          {campaign.title}
        </h3>
        {campaign.description && (
          <p className="text-[16px] leading-relaxed text-muted">{campaign.description}</p>
        )}
        <AdLink
          href={campaign.targetUrl}
          campaignId={campaign.id}
          className="neu-primary inline-flex w-fit items-center gap-1.5 rounded-full px-6 py-3 text-[15px] font-medium text-white"
        >
          Visitar página
          <span aria-hidden="true">→</span>
        </AdLink>
      </div>
    </div>
  );
}
