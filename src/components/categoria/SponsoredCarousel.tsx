"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { logPlacementClick, logPlacementImpression } from "@/lib/actions/log-search";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { openSlotBackground } from "./open-slot";

export type SponsoredSlide = {
  id: string;
  placementId: string;
  businessId: string;
  title: string;
  /** categoria · torre · andar */
  subtitle: string;
  description: string;
  image?: string;
  imageMobile?: string;
  href: string;
  /** link externo (campanha com URL própria): abre em outra aba e leva rel="sponsored" */
  external: boolean;
  ctaLabel: string;
  /** vaga livre ("Anuncie aqui"): sem selo de patrocinado, sem métricas */
  open?: boolean;
};

export type SponsoredCarouselLabels = {
  /** selo de todo slide */
  sponsored: string;
  /** selo das vagas livres */
  openSlot: string;
  region: string;
  previous: string;
  next: string;
  /** modelo com {n}, ex.: "Ir para o destaque {n}" (função não atravessa server → client) */
  goTo: string;
};

type SponsoredCarouselProps = {
  slides: SponsoredSlide[];
  labels: SponsoredCarouselLabels;
};

const AUTOPLAY_MS = 6000;
/** depois de qualquer interação (toque, foco, clique) a rotação automática espera este tempo */
const INTERACTION_PAUSE_MS = 12000;

/** Capa sem imagem: textura na cor institucional sobre grafite, o overlay garante a leitura. */
const FALLBACK_BG = {
  backgroundColor: "#2e2e2e",
  backgroundImage:
    "radial-gradient(circle at 25% 20%, color-mix(in srgb, var(--primary) 55%, transparent), transparent 60%), repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 14px)",
};

/**
 * Carrossel de campanhas patrocinadas. Desktop: um slide largo e os demais estreitos ao lado
 * (flex-grow animado); celular: faixa com swipe nativo (scroll-snap). Todo slide leva o selo
 * "Patrocinado". A rotação automática pausa com mouse, foco ou toque.
 */
export function SponsoredCarousel({ slides, labels }: SponsoredCarouselProps) {
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const loggedRef = useRef(new Set<string>());
  const lastInteractionRef = useRef(0);
  const hoveringRef = useRef(false);
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const count = slides.length;

  const markInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now();
  }, []);

  const goTo = useCallback(
    (index: number, userInitiated = false) => {
      if (userInitiated) markInteraction();
      const next = (index + count) % count;
      setActive(next);
      const track = trackRef.current;
      const slide = track?.children[next] as HTMLElement | undefined;
      // faixa rolável = layout de celular: centraliza o slide
      if (track && slide && track.scrollWidth > track.clientWidth + 1) {
        track.scrollTo({
          left: slide.offsetLeft - (track.clientWidth - slide.clientWidth) / 2,
          behavior: reducedMotion ? "auto" : "smooth",
        });
      }
    },
    [count, markInteraction, reducedMotion],
  );

  // swipe no celular: o slide mais próximo do centro vira o ativo
  const handleScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track || track.scrollWidth <= track.clientWidth + 1) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bestDistance = Infinity;
    Array.from(track.children).forEach((child, index) => {
      const element = child as HTMLElement;
      const distance = Math.abs(element.offsetLeft + element.clientWidth / 2 - center);
      if (distance < bestDistance) {
        best = index;
        bestDistance = distance;
      }
    });
    setActive(best);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver((entries) => setInView(entries.some((entry) => entry.isIntersecting)), {
      threshold: 0.4,
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  // 1 impressão por campanha: quando ela é o slide ativo com o carrossel na tela
  useEffect(() => {
    const slide = slides[active];
    if (!inView || !slide || slide.open || loggedRef.current.has(slide.placementId)) return;
    loggedRef.current.add(slide.placementId);
    void logPlacementImpression(slide.placementId, slide.businessId).catch(() => undefined);
  }, [active, inView, slides]);

  useEffect(() => {
    if (count < 2 || reducedMotion) return;
    const timer = setInterval(() => {
      if (hoveringRef.current || Date.now() - lastInteractionRef.current < INTERACTION_PAUSE_MS) return;
      if (document.hidden) return;
      goTo(active + 1);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [active, count, goTo, reducedMotion]);

  if (count === 0) return null;

  return (
    <section
      ref={rootRef}
      aria-roledescription="carousel"
      aria-label={labels.region}
      data-reveal
      className="relative"
      onPointerEnter={() => {
        hoveringRef.current = true;
      }}
      onPointerLeave={() => {
        hoveringRef.current = false;
      }}
      onPointerDown={markInteraction}
      onFocusCapture={markInteraction}
    >
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="relative flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:snap-none lg:overflow-visible [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, index) => {
          const isActive = index === active;
          const onClick = () => slide.open ? undefined : void logPlacementClick(slide.placementId, slide.businessId, "profile").catch(() => undefined);
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} / ${count}`}
              style={{ "--grow": isActive ? 7 : 1 } as React.CSSProperties}
              className="relative h-[280px] shrink-0 basis-[86%] snap-center overflow-hidden rounded-2xl bg-graphite text-white sm:h-[300px] sm:basis-[62%] lg:h-[320px] lg:min-w-[150px] lg:basis-0 lg:[flex-grow:var(--grow)] motion-safe:lg:transition-[flex-grow] motion-safe:lg:duration-500"
            >
              <div className="absolute inset-0" style={slide.open ? openSlotBackground(index) : slide.image ? undefined : FALLBACK_BG}>
                {slide.image && (
                  <picture>
                    {slide.imageMobile && <source media="(max-width: 639px)" srcSet={slide.imageMobile} />}
                    <img
                      src={slide.image}
                      alt=""
                      loading={index === 0 ? "eager" : "lazy"}
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </picture>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
              </div>

              <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[12px] font-medium text-primary">
                {slide.open ? labels.openSlot : labels.sponsored}
              </span>

              {isActive ? (
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-5 sm:p-7">
                  <h3 className="text-[clamp(1.4rem,2.6vw,2rem)] font-semibold leading-tight tracking-tight">{slide.title}</h3>
                  <p className="text-[14px] text-white/85">{slide.subtitle}</p>
                  {slide.description && (
                    <p className="mt-1 line-clamp-2 max-w-xl text-[15px] leading-snug text-white/85">{slide.description}</p>
                  )}
                  <div className="mt-3">
                    {slide.external ? (
                      <a
                        href={slide.href}
                        target="_blank"
                        rel="sponsored noopener noreferrer"
                        onClick={onClick}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-[15px] font-medium text-foreground"
                      >
                        {slide.ctaLabel}
                        <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </a>
                    ) : (
                      <Link
                        href={slide.href}
                        onClick={onClick}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-[15px] font-medium text-foreground"
                      >
                        {slide.ctaLabel}
                        <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => goTo(index, true)}
                  aria-label={`${slide.title} — ${slide.subtitle}`}
                  className="absolute inset-0 flex flex-col justify-end p-4 text-left"
                >
                  <span className="truncate text-[17px] font-semibold">{slide.title}</span>
                  <span className="truncate text-[13px] text-white/80">{slide.subtitle.split(" · ")[0]}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label={labels.previous}
            onClick={() => goTo(active - 1, true)}
            className="absolute left-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-sm hover:text-primary sm:flex lg:-left-5"
          >
            <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label={labels.next}
            onClick={() => goTo(active + 1, true)}
            className="absolute right-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-sm hover:text-primary sm:flex lg:-right-5"
          >
            <ChevronRight aria-hidden="true" className="h-5 w-5" />
          </button>
          <div className="mt-4 flex items-center justify-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={labels.goTo.replace("{n}", String(index + 1))}
                aria-current={index === active}
                onClick={() => goTo(index, true)}
                className="flex h-6 items-center"
              >
                <span
                  className={`block h-2 rounded-full transition-all duration-300 ${
                    index === active ? "w-6 bg-primary" : "w-2 bg-primary/30"
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
