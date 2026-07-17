"use client";

import { useCallback, useRef, useState } from "react";
import { ScrollStage } from "@/components/motion/ScrollStage";
import { RevealText } from "@/components/motion/RevealText";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function NetworkNarrative() {
  const reducedMotion = useReducedMotion();
  const [heroActive, setHeroActive] = useState(true);
  const heroActiveRef = useRef(true);

  const handleProgress = useCallback((progress: number) => {
    const next = progress < 0.6;
    if (next !== heroActiveRef.current) {
      heroActiveRef.current = next;
      setHeroActive(next);
    }
  }, []);

  return (
    <section id="top" aria-label="A rede de negócios do Cerâmica Hub">
      <ScrollStage
        heightVh={150}
        onProgress={handleProgress}
        className="relative bg-surface-dark text-foreground-dark"
      >
        <div
          className={`relative ${
            reducedMotion ? "min-h-[100svh]" : "h-[100svh] overflow-hidden"
          }`}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url(/images/espaco-ceramica.jpg)" }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(5,5,5,0.75) 0%, rgba(5,5,5,0.55) 40%, rgba(5,5,5,0.8) 80%, rgba(5,5,5,0.95) 100%)",
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
                <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-white/50">
                  Cerâmica Hub
                </p>
                <p className="mt-3 text-[13px] font-medium uppercase tracking-[0.2em] text-connection">
                  A rede de negócios do Cerâmica
                </p>
                <h1 className="mt-6 max-w-2xl text-[clamp(2.1rem,5vw,4rem)] font-semibold leading-[1.08] tracking-tight">
                  Tudo o que você precisa pode estar a poucos andares de distância.
                </h1>
                <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/70">
                  Descubra empresas, profissionais, serviços e oportunidades que já estão
                  trabalhando perto de você.
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <a
                    href="#empresas"
                    className="rounded-full bg-white px-7 py-3.5 text-[15px] font-medium text-black transition-transform hover:scale-[1.03]"
                  >
                    Explorar empresas
                  </a>
                  <a
                    href="#cadastro"
                    className="rounded-full border border-white/25 px-7 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
                  >
                    Cadastrar minha empresa
                  </a>
                </div>
              </RevealText>
            </div>

            <div
              className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 text-white/40 transition-opacity duration-500"
              style={{ opacity: heroActive ? 1 : 0 }}
            >
              <span className="block h-9 w-[1px] bg-white/30" />
            </div>
          </div>
        </div>
      </ScrollStage>
    </section>
  );
}
