"use client";

import { useEffect, useState } from "react";
import { AdCarouselTrack } from "@/components/ads/AdCarouselTrack";
import { Link } from "@/i18n/navigation";
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

  // Sem anunciante ativo nessa posição -- mostra o anúncio "casa" em vez de
  // sumir com o carrossel inteiro.
  if (campaigns.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-6">
        <Link
          href="/seja-um-parceiro"
          className="mx-auto block max-w-sm overflow-hidden border border-border"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/ceramica-hub-anuncie-vertical.webp"
            alt="Anuncie aqui — conecte sua marca a quem vive e trabalha no Cerâmica"
            className="w-full"
            loading="lazy"
          />
        </Link>
      </div>
    );
  }
  return <AdCarouselTrack campaigns={campaigns} />;
}
