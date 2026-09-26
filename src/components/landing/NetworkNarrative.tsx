"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { AdCarouselVertical } from "@/components/ads/AdCarouselVertical";
import { AdLink } from "@/components/ads/AdLink";
import { useSearch } from "@/components/landing/SearchContext";
import { logSearchPerformed } from "@/lib/actions/log-search";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Link } from "@/i18n/navigation";
import type { Tower } from "@/lib/services/towers";
import type { ActiveCampaign } from "@/lib/services/ads";

const EASE = [0.16, 1, 0.3, 1] as const;

const heroImages = [
  "/images/ceramica-hero-1.jpg",
  "/images/ceramica-hero-2.jpg",
  "/images/ceramica-hero-3.jpg",
  "/images/ceramica-hero-4.jpg",
];

const CYCLE_SECONDS = 24;

/** Slide 1 (institucional) sempre existe; slides 2 e 3 são Mídia de Capa
 * vendida (placement "hero_capa"). Sem campanha ativa, o hero fica só com o
 * slide institucional -- nunca cai num banner "anuncie aqui". */
const MAX_COVER_SLIDES = 2;
const INSTITUTIONAL_MS = 12000;
const COVER_MS = 8000;

type NetworkNarrativeProps = {
  towers: Tower[];
};

/** Hero estático (não mais scroll-jacked), dividido ~78/22 entre foto e
 * painel lateral de anúncios (desktop) -- seletor de torres horizontal no
 * mobile, já que o painel lateral nessa largura fica reservado pro anúncio.
 * Mesmo crossfade de 4 fotos do ComingSoon (.hero-slide), pra manter a
 * identidade visual do "em breve" quando o visitante chega na home de
 * verdade. */
export function NetworkNarrative({ towers }: NetworkNarrativeProps) {
  const t = useTranslations("NetworkNarrative");
  const { setQuery } = useSearch();
  const [heroSearchValue, setHeroSearchValue] = useState("");
  const reducedMotion = useReducedMotion();
  const [covers, setCovers] = useState<ActiveCampaign[]>([]);
  // 0 = institucional; 1..n = Mídia de Capa
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const slideCount = covers.length + 1;
  const activeCover = slide > 0 ? covers[slide - 1] : null;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ads/carousel?placement=hero_capa")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setCovers(data.slice(0, MAX_COVER_SLIDES));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (slideCount < 2 || paused || reducedMotion) return;
    const timer = setTimeout(
      () => setSlide((current) => (current + 1) % slideCount),
      slide === 0 ? INSTITUTIONAL_MS : COVER_MS,
    );
    return () => clearTimeout(timer);
  }, [slide, slideCount, paused, reducedMotion]);

  function submitHeroSearch(term: string) {
    const value = term.trim();
    setQuery(value);
    void logSearchPerformed(value, "hero");
    document.getElementById("empresas")?.scrollIntoView({ block: "start" });
  }

  return (
    <section id="top" aria-label={t("sectionLabel")} className="relative isolate overflow-hidden bg-graphite text-white">
      <div className="flex min-h-[640px] flex-col lg:h-[clamp(640px,66vw,760px)] lg:min-h-0 lg:flex-row">
        {/* Foto + texto principal -- ~78% da largura no desktop */}
        <div
          className="relative flex flex-1 flex-col justify-end overflow-hidden px-5 pb-10 pt-24 sm:px-[var(--page-padding)] lg:w-[78%] lg:flex-none lg:pb-14 lg:pt-0"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="absolute inset-0 -z-10 overflow-hidden">
            {heroImages.map((src, i) => (
              <div
                key={src}
                className="hero-slide absolute inset-0"
                style={{ animationDelay: `${i * -(CYCLE_SECONDS / heroImages.length)}s` }}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  priority={i === 0}
                  sizes="(min-width: 1024px) 78vw, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
          </div>

          {/* Mídia de Capa -- imagem em tela cheia por cima das fotos, sob o texto */}
          {covers.map((cover, i) => {
            const desktop = cover.creatives.find((c) => c.device === "desktop") ?? cover.creatives[0];
            const mobile = cover.creatives.find((c) => c.device === "mobile") ?? desktop;
            const active = slide === i + 1;
            return (
              <div
                key={cover.id}
                aria-hidden={!active}
                className={`absolute inset-0 -z-[9] transition-opacity duration-1000 ${active ? "opacity-100" : "opacity-0"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mobile.imageUrl} alt={mobile.altText} className="h-full w-full object-cover sm:hidden" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={desktop.imageUrl} alt={desktop.altText} className="hidden h-full w-full object-cover sm:block" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/5" />
              </div>
            );
          })}

          <div
            inert={activeCover !== null}
            aria-hidden={activeCover !== null}
            className={`transition-opacity duration-700 ${activeCover ? "opacity-0" : "opacity-100"}`}
          >
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 28, filter: "blur(6px)" }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, ease: EASE }}
            className="max-w-[600px]"
          >
            <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-white/80 sm:text-[14px]">
              {t("eyebrow")}
            </p>
            <h1 className="mt-[14px] text-[clamp(1.9rem,4.6vw,3.4rem)] font-semibold leading-[1.1] tracking-tight text-white">
              {t("headline")}
            </h1>
            <p className="mt-[20px] max-w-xl text-[16px] leading-relaxed text-white/80 sm:text-[18px]">
              {t("subhead")}
            </p>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                submitHeroSearch(heroSearchValue);
              }}
              className="mt-[28px] flex items-center gap-2 rounded-full border border-white/25 bg-white/10 p-1 pl-4 backdrop-blur-md sm:p-1.5 sm:pl-5"
            >
              <input
                type="text"
                value={heroSearchValue}
                onChange={(event) => setHeroSearchValue(event.target.value)}
                placeholder={t("searchPlaceholder")}
                className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-white placeholder:text-white/60 focus:outline-none sm:py-2.5 sm:text-[16px]"
              />
              <button
                type="submit"
                className="shrink-0 neu-primary rounded-full px-4 py-2 text-[14px] font-medium text-white sm:px-5 sm:py-2.5 sm:text-[15px]"
              >
                {t("searchButton")}
              </button>
            </form>

            <div className="mt-[20px] flex flex-wrap items-center gap-4">
              <a
                href="#empresas"
                className="liquid-dark rounded-full px-5 py-2.5 text-[14px] font-medium text-white sm:px-6 sm:py-3 sm:text-[15px]"
              >
                {t("ctaExplore")}
              </a>
              <Link
                href="/cadastro"
                className="text-[14px] font-medium text-white/85 underline underline-offset-4 transition-colors hover:text-white sm:text-[15px]"
              >
                {t("ctaRegister")}
              </Link>
            </div>

            {/* Torres -- só no mobile; no desktop esse espaço lateral virou o carrossel de anúncios */}
            {towers.length > 0 && (
              <div className="mt-[28px] flex gap-2 overflow-x-auto pb-1 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {towers.map((tower) => (
                  <Link
                    key={tower.id}
                    href={`/torres/${tower.slug}`}
                    className="shrink-0 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-[13px] font-medium text-white/90"
                  >
                    {tower.name}
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
          </div>

          {activeCover && (
            <div key={activeCover.id} className="absolute inset-x-0 bottom-0 max-w-[640px] px-5 pb-14 sm:px-[var(--page-padding)] lg:pb-16">
              <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-white/80 sm:text-[14px]">
                {t("coverPresentedBy")}
              </p>
              <h2 className="mt-3 text-[clamp(1.9rem,4.2vw,3.1rem)] font-semibold leading-[1.1] tracking-tight text-white">
                {activeCover.title}
              </h2>
              {activeCover.description && (
                <p className="mt-3 max-w-md text-[16px] leading-relaxed text-white/85 sm:text-[17px]">
                  {activeCover.description}
                </p>
              )}
              <AdLink
                href={activeCover.targetUrl}
                campaignId={activeCover.id}
                className="liquid-dark mt-6 inline-block rounded-full px-6 py-3 text-[15px] font-medium text-white"
              >
                {t("coverCta")}
              </AdLink>
            </div>
          )}

          {slideCount > 1 && (
            <div className="absolute bottom-5 right-5 flex items-center gap-2 sm:right-[var(--page-padding)]">
              {Array.from({ length: slideCount }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`${i + 1} / ${slideCount}`}
                  aria-current={slide === i}
                  onClick={() => setSlide(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    slide === i ? "w-8 bg-white" : "w-4 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Painel lateral -- carrossel de anúncios (desktop) */}
        <div className="relative hidden shrink-0 overflow-hidden bg-graphite lg:block lg:w-[22%] lg:min-w-[260px]">
          <AdCarouselVertical placementKey="hero_lateral" />
        </div>
      </div>
    </section>
  );
}
