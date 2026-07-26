"use client";

import { AdLink } from "@/components/ads/AdLink";
import type { ActiveCampaign } from "@/lib/services/ads";

export function AdCarouselTrack({ campaigns }: { campaigns: ActiveCampaign[] }) {
  // Duplica a lista pra loop sem costura: a faixa anda -50% (metade do
  // conteudo, que e uma copia inteira da outra metade) e reinicia sem salto.
  const track = [...campaigns, ...campaigns];

  return (
    <div className="overflow-hidden">
      <div className="group flex w-max gap-5 [animation:ad-marquee_40s_linear_infinite] hover:[animation-play-state:paused]">
        {track.map((campaign, index) => {
          const image = campaign.creatives.find((c) => c.device === "desktop") ?? campaign.creatives[0];
          return (
            <AdLink
              key={`${campaign.id}-${index}`}
              href={campaign.targetUrl}
              campaignId={campaign.id}
              className="relative block h-80 w-60 shrink-0 overflow-hidden rounded-3xl shadow-[0_20px_40px_-20px_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-1 sm:h-96 sm:w-72"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.imageUrl} alt={image.altText} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-white">
                Patrocinado
              </span>
              <p className="absolute bottom-4 left-4 right-4 text-[17px] font-semibold leading-snug text-white">
                {campaign.title}
              </p>
            </AdLink>
          );
        })}
      </div>
    </div>
  );
}
