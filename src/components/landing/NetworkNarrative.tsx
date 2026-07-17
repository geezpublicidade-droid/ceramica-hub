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
        className="relative bg-surface text-foreground"
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
                    A rede de negócios do Cerâmica
                  </p>
                  <h1 className="mt-6 text-[clamp(2.1rem,5vw,4rem)] font-semibold leading-[1.08] tracking-tight text-foreground">
                    Tudo o que você precisa pode estar a poucos andares de distância.
                  </h1>
                  <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
                    Descubra empresas, profissionais, serviços e oportunidades que já estão
                    trabalhando perto de você.
                  </p>
                  <div className="mt-10 flex flex-wrap gap-4">
                    <a
                      href="#empresas"
                      className="rounded-full bg-primary px-7 py-3.5 text-[15px] font-medium text-white transition-transform hover:scale-[1.03]"
                    >
                      Explorar empresas
                    </a>
                    <a
                      href="#cadastro"
                      className="glass-card-light rounded-full px-7 py-3.5 text-[15px] font-medium text-foreground transition-colors hover:bg-white"
                    >
                      Cadastrar minha empresa
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
