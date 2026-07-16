"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback, useRef, useState, type ReactNode } from "react";
import { ScrollStage } from "@/components/motion/ScrollStage";
import { RevealText } from "@/components/motion/RevealText";
import { CSSFallbackScene } from "./CSSFallbackScene";
import { useDeviceCapability } from "@/hooks/useDeviceCapability";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { PlatformStats } from "@/lib/services/platform";

const SceneCanvas = dynamic(() => import("@/components/three/SceneCanvas"), { ssr: false });

type Stage =
  | "hero"
  | "scale-businesses"
  | "scale-sectors"
  | "scale-connection"
  | "disconnected"
  | "connect-discover"
  | "connect-connect"
  | "connect-collaborate"
  | "connect-grow";

function resolveStage(progress: number): Stage {
  if (progress < 0.18) return "hero";
  if (progress < 0.28) return "scale-businesses";
  if (progress < 0.36) return "scale-sectors";
  if (progress < 0.46) return "scale-connection";
  if (progress < 0.6) return "disconnected";
  if (progress < 0.72) return "connect-discover";
  if (progress < 0.82) return "connect-connect";
  if (progress < 0.91) return "connect-collaborate";
  return "connect-grow";
}

function StageBlock({ active, children }: { active: boolean; children: ReactNode }) {
  const reducedMotion = useReducedMotion();

  // sem movimento: as cenas viram um fluxo normal empilhado, todas visíveis e
  // navegáveis por scroll comum — nada fica escondido atrás de um estágio
  // que nunca é alcançado sem a narrativa dirigida por scroll.
  if (reducedMotion) {
    return (
      <div className="relative w-full px-6 py-24">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 flex flex-col items-start justify-center px-6"
      style={{ pointerEvents: active ? "auto" : "none" }}
    >
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </div>
  );
}

type NetworkNarrativeProps = {
  stats: PlatformStats;
};

export function NetworkNarrative({ stats }: NetworkNarrativeProps) {
  const capability = useDeviceCapability();
  const [stage, setStage] = useState<Stage>("hero");
  const stageRef = useRef<Stage>("hero");

  const handleProgress = useCallback((progress: number) => {
    const next = resolveStage(progress);
    if (next !== stageRef.current) {
      stageRef.current = next;
      setStage(next);
    }
  }, []);

  return (
    <section id="top" aria-label="A rede de negócios do Cerâmica Hub">
      <ScrollStage
        heightVh={300}
        onProgress={handleProgress}
        className="relative bg-surface-dark text-foreground-dark"
      >
        {/* altura própria (100svh), independente do fluxo empilhado do modo
            reduced-motion — sem isso, essas camadas absolutas esticam pela
            altura inteira do bloco (todas as cenas somadas) em vez de uma
            única tela. */}
        <div
          className={`relative ${
            capability.reducedMotion ? "min-h-[100svh]" : "h-[100svh] overflow-hidden"
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

          {capability.ready && capability.shouldRender3D ? (
            <Suspense fallback={null}>
              <SceneCanvas />
            </Suspense>
          ) : (
            <CSSFallbackScene />
          )}

          {/* fica dentro do mesmo wrapper de 100svh que a foto/cena, pra
              sempre aparecer sobreposta a ela — inclusive sem animação */}
          <StageBlock active={stage === "hero"}>
            <RevealText active={stage === "hero"} stagger={0.12}>
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

            <div
              className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 text-white/40 transition-opacity duration-500"
              style={{ opacity: stage === "hero" ? 1 : 0 }}
            >
              <span className="block h-9 w-[1px] bg-white/30" />
            </div>
          </StageBlock>
        </div>

        <div className="relative z-10 h-full">

          <StageBlock active={stage === "scale-businesses"}>
            <RevealText active={stage === "scale-businesses"}>
              <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] font-semibold tracking-tight">
                {stats.businesses}+ empresas no mesmo endereço.
              </h2>
            </RevealText>
          </StageBlock>

          <StageBlock active={stage === "scale-sectors"}>
            <RevealText active={stage === "scale-sectors"}>
              <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] font-semibold tracking-tight">
                {stats.categories} setores diferentes, sob o mesmo teto.
              </h2>
            </RevealText>
          </StageBlock>

          <StageBlock active={stage === "scale-connection"}>
            <RevealText active={stage === "scale-connection"}>
              <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] font-semibold tracking-tight">
                Um único ponto de conexão.
              </h2>
            </RevealText>
          </StageBlock>

          <StageBlock active={stage === "disconnected"}>
            <RevealText active={stage === "disconnected"}>
              <h2 className="max-w-2xl text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-tight tracking-tight">
                Trabalhar perto não significa estar conectado.
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/60">
                Muitas empresas dividem o mesmo espaço, mas ainda não conhecem os
                serviços, profissionais e oportunidades que existem ao redor.
              </p>
            </RevealText>
          </StageBlock>

          <StageBlock active={stage === "connect-discover"}>
            <RevealText active={stage === "connect-discover"}>
              <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-semibold tracking-tight">
                Descubra.
              </h2>
            </RevealText>
          </StageBlock>

          <StageBlock active={stage === "connect-connect"}>
            <RevealText active={stage === "connect-connect"}>
              <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-semibold tracking-tight">
                Conecte.
              </h2>
            </RevealText>
          </StageBlock>

          <StageBlock active={stage === "connect-collaborate"}>
            <RevealText active={stage === "connect-collaborate"}>
              <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-semibold tracking-tight">
                Colabore.
              </h2>
            </RevealText>
          </StageBlock>

          <StageBlock active={stage === "connect-grow"}>
            <RevealText active={stage === "connect-grow"}>
              <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-semibold tracking-tight">
                Cresça.
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
                Quando os negócios se conectam, todo o ecossistema cresce.
              </p>
            </RevealText>
          </StageBlock>
        </div>
      </ScrollStage>
    </section>
  );
}
