"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AdLink } from "@/components/ads/AdLink";
import { Link } from "@/i18n/navigation";
import type { ActiveCampaign } from "@/lib/services/ads";

const ROTATE_MS = 6000;

/**
 * Variante vertical do AdCarousel pra espaços estreitos e altos (painel
 * lateral do hero) -- um anúncio por vez, ocupando o painel inteiro, com
 * troca automática. Mesma fonte de dados (/api/ads/carousel). Sem campanha
 * paga ainda, gira um mini-carrossel "casa" sem foto (fundo terracota),
 * reaproveitando textos reais já existentes (AdvertisersCTA/PremiumSponsors)
 * em vez de inventar copy nova.
 */
export function AdCarouselVertical({ placementKey }: { placementKey: string }) {
  const tAds = useTranslations("AdvertisersCTA");
  const tSponsors = useTranslations("PremiumSponsors");
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

  const fallbackSlides = [
    { eyebrow: tAds("eyebrow"), headline: tAds("headline"), cta: tAds("cta"), bg: "bg-primary", href: "/seja-um-parceiro" },
    { eyebrow: tSponsors("eyebrow"), headline: tSponsors("headline"), cta: tSponsors("ctaAction"), bg: "bg-graphite", href: "/seja-um-parceiro?tipo=patrocinador" },
  ];
  const count = campaigns.length > 0 ? campaigns.length : fallbackSlides.length;

  useEffect(() => {
    if (count < 2) return;
    const interval = setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(interval);
  }, [count]);

  // Sem campanha paga nessa posição ainda -- vende o próprio espaço com um
  // mini-carrossel de texto, sem foto, alternando de cor a cada slide, com
  // transição em 3D (cubo girando no eixo Y via perspective + rotateY).
  if (campaigns.length === 0) {
    return (
      <Link
        href={fallbackSlides[index % fallbackSlides.length].href}
        className="absolute inset-0 block overflow-hidden [perspective:1200px]">
        {fallbackSlides.map((slide, i) => {
          const active = i === index % fallbackSlides.length;
          return (
            <div
              key={i}
              className={`absolute inset-0 flex flex-col justify-end p-6 transition-all duration-700 ease-out ${slide.bg} ${
                active
                  ? "[transform:rotateY(0deg)_translateZ(0px)] opacity-100"
                  : "pointer-events-none opacity-0 [transform:rotateY(90deg)_translateZ(-120px)]"
              }`}
            >
              <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-white/80">{slide.eyebrow}</p>
              <p className="mt-2 text-[19px] font-semibold leading-snug text-white">{slide.headline}</p>
              <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-foreground transition-transform hover:scale-105">
                {slide.cta}
                <span aria-hidden="true">→</span>
              </span>
            </div>
          );
        })}
      </Link>
    );
  }

  const campaign = campaigns[index % campaigns.length];
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
