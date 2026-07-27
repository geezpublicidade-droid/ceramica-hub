"use client";

import { useEffect, useState } from "react";
import { AdLink } from "@/components/ads/AdLink";
import type { ActiveCampaign } from "@/lib/services/ads";

/**
 * Banner de destaque com 2 cards visíveis por vez (janela deslizante sobre
 * a lista de campanhas) -- estilo vindo de um esboço no Figma: cards bem
 * arredondados, imagem+texto lado a lado, acento teal, indicador de
 * progresso em barrinhas, setas circulares nos cantos. Busca via
 * /api/ads/carousel (mesmo endpoint do carrossel de baixo) pra sortear o
 * ponto de partida a cada carregamento.
 */
export function AdBanner({ placementKey }: { placementKey: string }) {
  const [campaigns, setCampaigns] = useState<ActiveCampaign[]>([]);
  const [startIndex, setStartIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ads/carousel?placement=${encodeURIComponent(placementKey)}`)
      .then((res) => res.json())
      .then((data: ActiveCampaign[]) => {
        if (cancelled || !Array.isArray(data) || data.length === 0) return;
        setCampaigns(data);
        setStartIndex(Math.floor(Math.random() * data.length));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [placementKey]);

  function goTo(next: number) {
    setVisible(false);
    setTimeout(() => {
      setStartIndex((next + campaigns.length) % campaigns.length);
      setVisible(true);
    }, 200);
  }

  if (campaigns.length === 0) return null;

  const visibleCampaigns =
    campaigns.length === 1
      ? [campaigns[0]]
      : [campaigns[startIndex % campaigns.length], campaigns[(startIndex + 1) % campaigns.length]];

  return (
    <div className="relative px-6 py-10 sm:py-14">
      <div
        className={`mx-auto grid max-w-6xl grid-cols-1 gap-6 transition-all duration-200 sm:grid-cols-2 ${
          visible ? "opacity-100 blur-0" : "opacity-0 blur-md"
        }`}
        style={{ fontFamily: "var(--font-alexandria)" }}
      >
        {visibleCampaigns.map((campaign) => {
          const image = campaign.creatives.find((c) => c.device === "desktop") ?? campaign.creatives[0];
          if (!image) return null;
          return (
            <div
              key={campaign.id}
              className="relative flex items-center gap-5 rounded-[48px] border border-white bg-[#fefefe] p-5 shadow-[5px_0_40px_3px_rgba(4,111,141,0.25)] sm:gap-6 sm:p-6"
            >
              <div className="relative h-48 w-2/5 shrink-0 overflow-hidden rounded-[36px] sm:h-64">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.imageUrl} alt={image.altText} className="h-full w-full object-cover" />
                <span className="absolute left-2.5 top-2.5 rounded-full bg-ad-teal px-3 py-1 text-[11px] font-medium text-white shadow-[5px_0_40px_3px_rgba(4,111,141,0.25)] sm:text-[12px]">
                  Patrocinado
                </span>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <h3 className="text-[22px] font-normal leading-tight text-foreground sm:text-[28px]">
                  {campaign.title}
                </h3>
                {campaign.description && (
                  <p className="text-[14px] leading-snug text-foreground/70 sm:text-[16px]">{campaign.description}</p>
                )}
                <AdLink
                  href={campaign.targetUrl}
                  campaignId={campaign.id}
                  className="mt-1 inline-flex w-fit items-center rounded-full border border-white bg-[#fefefe] px-5 py-2.5 text-[13px] font-medium text-foreground shadow-[5px_0_40px_3px_rgba(4,111,141,0.25)] transition-transform hover:scale-105 sm:text-[15px]"
                >
                  VER OFERTA
                </AdLink>
              </div>
            </div>
          );
        })}
      </div>

      {campaigns.length > 1 && (
        <>
          <div className="mt-6 flex items-center justify-center gap-2">
            {campaigns.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir para anúncio ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-[7px] w-[42px] rounded-full transition-colors sm:w-[74px] ${
                  i === startIndex % campaigns.length ? "border border-ad-teal bg-white" : "bg-ad-teal"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            aria-label="Anúncio anterior"
            onClick={() => goTo(startIndex - 1)}
            className="absolute bottom-4 left-4 flex h-8 w-8 items-center justify-center rounded-full bg-ad-teal text-white shadow-[5px_0_40px_3px_rgba(4,111,141,0.25)] sm:bottom-6 sm:left-6 sm:h-[31px] sm:w-[31px]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Próximo anúncio"
            onClick={() => goTo(startIndex + 1)}
            className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-ad-teal text-white shadow-[5px_0_40px_3px_rgba(4,111,141,0.25)] sm:bottom-6 sm:right-6 sm:h-12 sm:w-12"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
