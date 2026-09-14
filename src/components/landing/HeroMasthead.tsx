"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

// Começa em hero-3, não hero-1 -- a NetworkNarrative logo acima já abre com
// hero-1.jpg em repouso (progress 0), então repetir a mesma foto aqui em
// seguida pareceria que nada mudou na tela.
const SLIDES = ["/images/ceramica-hero-3.jpg", "/images/ceramica-hero-4.jpg", "/images/ceramica-hero-2.jpg"];
const AUTO_ADVANCE_MS = 6000;

/**
 * Masthead rotativo do topo -- estilo vindo do mesmo esboço no Figma do
 * AdBanner (cartão bem arredondado, foto de fundo, texto sobreposto do
 * lado esquerdo, setas circulares nas bordas, indicador de progresso em
 * pontos). Fotos reais do Espaço Cerâmica, sem placeholder.
 */
export function HeroMasthead() {
  const t = useTranslations("HeroMasthead");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), AUTO_ADVANCE_MS);
    return () => clearInterval(interval);
  }, []);

  function goTo(next: number) {
    setIndex((next + SLIDES.length) % SLIDES.length);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-6 sm:py-10">
      <div className="relative isolate h-[280px] overflow-hidden rounded-[40px] sm:h-[360px] md:h-[420px]">
        {SLIDES.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />

        <div
          className="relative z-10 flex h-full max-w-[75%] flex-col justify-center gap-3 pl-8 sm:max-w-[52%] sm:pl-14"
          style={{ fontFamily: "var(--font-alexandria)" }}
        >
          <p className="text-[24px] leading-none tracking-tight text-white sm:text-[34px] md:text-[40px]">
            {t("titlePrefix")} <span className="font-bold text-primary-light">{t("titleHighlight")}</span>
          </p>
          <p className="text-[14px] leading-snug text-white/85 sm:text-[18px] md:text-[20px]">
            {t("subtitlePrefix")}{" "}
            <span className="font-semibold text-primary-light">{t("subtitleHighlight")}</span>
          </p>
        </div>

        {SLIDES.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={() => goTo(index - 1)}
              className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary-light text-white shadow-[0_4px_14px_rgba(0,0,0,0.25)] transition hover:scale-110"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Próxima foto"
              onClick={() => goTo(index + 1)}
              className="absolute right-0 top-1/2 z-10 flex h-9 w-9 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary-light text-white shadow-[0_4px_14px_rgba(0,0,0,0.25)] transition hover:scale-110"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Ir para foto ${i + 1}`}
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full transition-all ${i === index ? "w-8 bg-white" : "w-2 bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
