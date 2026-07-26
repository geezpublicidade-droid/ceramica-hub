"use client";

import { useEffect, useRef, useState } from "react";
import { AdLink } from "@/components/ads/AdLink";
import type { ActiveCampaign } from "@/lib/services/ads";

const CARD_GAP_PX = 20;
const AUTO_ADVANCE_MS = 4000;
const RESUME_AFTER_MANUAL_MS = 6000;
const BLUR_TRANSITION_MS = 350;

export function AdCarouselTrack({ campaigns }: { campaigns: ActiveCampaign[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedUntilRef = useRef(0);
  const [transitioning, setTransitioning] = useState(false);

  function cardWidth(): number {
    const card = scrollRef.current?.querySelector<HTMLElement>("[data-card]");
    return (card?.offsetWidth ?? 260) + CARD_GAP_PX;
  }

  function advance(direction: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;

    setTransitioning(true);
    setTimeout(() => setTransitioning(false), BLUR_TRANSITION_MS);

    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    const atStart = el.scrollLeft <= 4;
    if (direction === 1 && atEnd) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else if (direction === -1 && atStart) {
      el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    } else {
      el.scrollBy({ left: cardWidth() * direction, behavior: "smooth" });
    }
  }

  function handleManualClick(direction: 1 | -1) {
    advance(direction);
    pausedUntilRef.current = Date.now() + RESUME_AFTER_MANUAL_MS;
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() < pausedUntilRef.current) return;
      advance(1);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className={`flex gap-5 overflow-x-auto scroll-smooth px-6 pb-2 transition-[filter,opacity] duration-300 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          transitioning ? "opacity-70 blur-sm" : "opacity-100 blur-0"
        }`}
        style={{ scrollSnapType: "x mandatory" }}
      >
        {campaigns.map((campaign) => {
          const image = campaign.creatives.find((c) => c.device === "desktop") ?? campaign.creatives[0];
          return (
            <div
              key={campaign.id}
              data-card
              className="relative h-80 w-60 shrink-0 overflow-hidden rounded-3xl shadow-[0_20px_40px_-20px_rgba(0,0,0,0.25)] sm:h-96 sm:w-72"
              style={{ scrollSnapAlign: "start" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.imageUrl} alt={image.altText} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-white">
                Patrocinado
              </span>
              <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-3">
                <p className="text-[17px] font-semibold leading-snug text-white">{campaign.title}</p>
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
        })}
      </div>

      <button
        type="button"
        aria-label="Anúncio anterior"
        onClick={() => handleManualClick(-1)}
        className="absolute left-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white/90 p-2.5 shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition hover:bg-white sm:flex"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Próximo anúncio"
        onClick={() => handleManualClick(1)}
        className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white/90 p-2.5 shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition hover:bg-white sm:flex"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
