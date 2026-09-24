"use client";

import { useEffect, useState } from "react";
import { AdLink } from "@/components/ads/AdLink";
import { Link } from "@/i18n/navigation";
import type { ActiveCampaign } from "@/lib/services/ads";

const ROTATE_MS = 6000;

/**
 * Variante vertical do AdCarousel pra espaços estreitos e altos (painel
 * lateral do hero) -- um anúncio por vez, ocupando o painel inteiro, com
 * troca automática. Mesma fonte de dados (/api/ads/carousel) e mesmo
 * espírito de fallback "casa" do AdCarousel horizontal.
 */
export function AdCarouselVertical({ placementKey }: { placementKey: string }) {
  const [campaigns, setCampaigns] = useState<ActiveCampaign[]>([]);
  const [index, setIndex] = useState(0);

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

  useEffect(() => {
    if (campaigns.length < 2) return;
    const interval = setInterval(() => setIndex((i) => (i + 1) % campaigns.length), ROTATE_MS);
    return () => clearInterval(interval);
  }, [campaigns.length]);

  // Sem campanha paga nessa posição ainda -- vende o próprio espaço.
  if (campaigns.length === 0) {
    return (
      <Link href="/seja-um-parceiro" className="absolute inset-0 block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/ceramica-hub-anuncie-vertical.webp"
          alt="Anuncie aqui — conecte sua marca a quem vive e trabalha no Cerâmica"
          className="h-full w-full object-cover"
        />
      </Link>
    );
  }

  const campaign = campaigns[index];
  const image = campaign.creatives.find((c) => c.device === "desktop") ?? campaign.creatives[0];

  return (
    <div className="absolute inset-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={campaign.id} src={image.imageUrl} alt={image.altText} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <span className="absolute left-4 top-4 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-white">
        Patrocinado
      </span>
      <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-3">
        <p className="text-[15px] font-semibold leading-snug text-white">{campaign.title}</p>
        <AdLink
          href={campaign.targetUrl}
          campaignId={campaign.id}
          className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-foreground transition-transform hover:scale-105"
        >
          Visitar página
          <span aria-hidden="true">→</span>
        </AdLink>
      </div>
    </div>
  );
}
