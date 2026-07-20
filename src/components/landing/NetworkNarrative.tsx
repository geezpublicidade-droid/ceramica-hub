"use client";

import { useCallback, useRef, useState } from "react";
import { motion, type Variants } from "motion/react";
import { ScrollStage } from "@/components/motion/ScrollStage";
import { RevealText } from "@/components/motion/RevealText";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSearch } from "@/components/landing/SearchContext";
import { logSearchPerformed } from "@/lib/actions/log-search";

const heroImages = [
  "/images/ceramica-hero-1.jpg",
  "/images/ceramica-hero-2.jpg",
  "/images/ceramica-hero-3.jpg",
  "/images/ceramica-hero-4.jpg",
];

function resolveImageIndex(progress: number) {
  if (progress < 0.25) return 0;
  if (progress < 0.5) return 1;
  if (progress < 0.75) return 2;
  return 3;
}

const image: Variants = {
  hidden: { opacity: 0, filter: "blur(28px)", scale: 1.06 },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] },
  },
};

export function NetworkNarrative() {
  const reducedMotion = useReducedMotion();
  const [heroActive, setHeroActive] = useState(true);
  const heroActiveRef = useRef(true);
  const [imageIndex, setImageIndex] = useState(0);
  const imageIndexRef = useRef(0);
  const { setQuery } = useSearch();
  const [heroSearchValue, setHeroSearchValue] = useState("");

  function submitHeroSearch(term: string) {
    const value = term.trim();
    setQuery(value);
    void logSearchPerformed(value, "hero");
    document.getElementById("empresas")?.scrollIntoView({ block: "start" });
  }

  const handleProgress = useCallback((progress: number) => {
    const active = progress < 0.85;
    if (active !== heroActiveRef.current) {
      heroActiveRef.current = active;
      setHeroActive(active);
    }

    const nextImage = resolveImageIndex(progress);
    if (nextImage !== imageIndexRef.current) {
      imageIndexRef.current = nextImage;
      setImageIndex(nextImage);
    }
  }, []);

  return (
    <section id="top" aria-label="A rede de negócios do Cerâmica Hub">
      <ScrollStage
        heightVh={130}
        onProgress={handleProgress}
        className="relative bg-surface text-foreground"
      >
        <div
          className={`relative ${
            reducedMotion ? "min-h-[100svh]" : "h-[100svh] overflow-hidden"
          }`}
        >
          {reducedMotion ? (
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${heroImages[0]})` }}
            />
          ) : (
            heroImages.map((src, index) => (
              <motion.div
                key={src}
                aria-hidden="true"
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${src})` }}
                initial="hidden"
                animate={imageIndex === index ? "visible" : "hidden"}
                variants={image}
              />
            ))
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.3) 45%, rgba(245,245,247,0.65) 80%, rgba(245,245,247,0.9) 100%)",
            }}
          />

          <div
            className={
              reducedMotion
                ? "relative w-full px-6 py-24"
                : "absolute inset-0 flex flex-col items-start justify-center px-6"
            }
          >
            <div className="mx-auto w-full max-w-6xl">
              <RevealText active={heroActive} stagger={0.12}>
                <div className="glass-light max-w-2xl rounded-3xl p-8 sm:p-10">
                  <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-muted">
                    Cerâmica Hub
                  </p>
                  <p className="mt-3 text-[13px] font-medium uppercase tracking-[0.2em] text-primary">
                    A rede de negócios do Espaço Cerâmica
                  </p>
                  <h1 className="mt-6 text-[clamp(2.1rem,5vw,4rem)] font-semibold leading-[1.08] tracking-tight text-foreground">
                    Encontre empresas, serviços e oportunidades a poucos andares de distância.
                  </h1>
                  <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
                    O Cerâmica Hub conecta visitantes e empresas das torres Park, Union, Way e
                    Gate em uma única plataforma.
                  </p>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      submitHeroSearch(heroSearchValue);
                    }}
                    className="mt-7 flex items-center gap-2 rounded-full border border-border bg-white/80 p-1.5 pl-5"
                  >
                    <input
                      type="text"
                      value={heroSearchValue}
                      onChange={(event) => setHeroSearchValue(event.target.value)}
                      placeholder="O que você está procurando?"
                      className="min-w-0 flex-1 bg-transparent py-2.5 text-[14px] text-foreground placeholder:text-muted focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="neu-primary shrink-0 rounded-full px-5 py-2.5 text-[13px] font-medium text-white"
                    >
                      Buscar
                    </button>
                  </form>
                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <a href="/cadastro" className="neu-primary rounded-full px-7 py-3.5 text-[15px] font-medium text-white">
                      Cadastrar empresa gratuitamente
                    </a>
                    <a
                      href="#empresas"
                      className="text-[14px] font-medium text-foreground transition-colors hover:text-primary"
                    >
                      Explorar empresas →
                    </a>
                  </div>
                </div>
              </RevealText>
            </div>

            <div
              className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 text-muted transition-opacity duration-500"
              style={{ opacity: heroActive ? 1 : 0 }}
            >
              <span className="block h-9 w-[1px] bg-foreground/20" />
            </div>
          </div>
        </div>
      </ScrollStage>
    </section>
  );
}
