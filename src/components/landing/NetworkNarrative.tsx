"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { AdCarouselVertical } from "@/components/ads/AdCarouselVertical";
import { useSearch } from "@/components/landing/SearchContext";
import { logSearchPerformed } from "@/lib/actions/log-search";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Link } from "@/i18n/navigation";
import type { Tower } from "@/lib/services/towers";

const EASE = [0.16, 1, 0.3, 1] as const;

const heroImages = [
  "/images/ceramica-hero-1.jpg",
  "/images/ceramica-hero-2.jpg",
  "/images/ceramica-hero-3.jpg",
  "/images/ceramica-hero-4.jpg",
];

const CYCLE_SECONDS = 24;

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
        <div className="relative flex flex-1 flex-col justify-end overflow-hidden px-5 pb-10 pt-24 sm:px-[var(--page-padding)] lg:w-[78%] lg:flex-none lg:pb-14 lg:pt-0">
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
                className="shrink-0 rounded-full bg-primary px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-primary-light sm:px-5 sm:py-2.5 sm:text-[15px]"
              >
                {t("searchButton")}
              </button>
            </form>

            <div className="mt-[20px] flex flex-wrap items-center gap-4">
              <a
                href="#empresas"
                className="rounded-full border border-white/70 px-5 py-2.5 text-[14px] font-medium text-white transition-all duration-300 hover:scale-105 hover:bg-white hover:text-graphite sm:px-6 sm:py-3 sm:text-[15px]"
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

        {/* Painel lateral -- carrossel de anúncios (desktop) */}
        <div className="relative hidden shrink-0 overflow-hidden bg-graphite lg:block lg:w-[22%] lg:min-w-[260px]">
          <AdCarouselVertical placementKey="hero_lateral" />
        </div>
      </div>
    </section>
  );
}
