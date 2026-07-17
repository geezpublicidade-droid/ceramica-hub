"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { motion, type Variants } from "motion/react";
import { ScrollStage } from "@/components/motion/ScrollStage";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { PlatformStats } from "@/lib/services/platform";

type Stage = "businesses" | "sectors" | "connection" | "disconnected" | "grow";

/** a mensagem final ganha a maior janela de progresso — fica visível por mais tempo */
function resolveStage(progress: number): Stage {
  if (progress < 0.2) return "businesses";
  if (progress < 0.4) return "sectors";
  if (progress < 0.58) return "connection";
  if (progress < 0.76) return "disconnected";
  return "grow";
}

const phrase: Variants = {
  hidden: {
    opacity: 0,
    y: 22,
    scale: 0.96,
    filter: "blur(14px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
  },
};

function PhraseBlock({ active, large, children }: { active: boolean; large?: boolean; children: ReactNode }) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <div className={`w-full px-6 py-20 text-center ${large ? "py-28" : ""}`}>
        <div className="mx-auto max-w-4xl">{children}</div>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 flex items-center justify-center px-6"
      style={{ pointerEvents: active ? "auto" : "none" }}
    >
      <motion.div
        initial="hidden"
        animate={active ? "visible" : "hidden"}
        variants={phrase}
        className="mx-auto max-w-4xl text-balance text-center"
      >
        {children}
      </motion.div>
    </div>
  );
}

type ScaleSequenceProps = {
  stats: PlatformStats;
};

export function ScaleSequence({ stats }: ScaleSequenceProps) {
  const [stage, setStage] = useState<Stage>("businesses");
  const stageRef = useRef<Stage>("businesses");

  const handleProgress = useCallback((progress: number) => {
    const next = resolveStage(progress);
    if (next !== stageRef.current) {
      stageRef.current = next;
      setStage(next);
    }
  }, []);

  return (
    <section aria-label="A escala do Cerâmica Hub">
      <ScrollStage heightVh={400} onProgress={handleProgress} className="relative bg-surface-dark">
        <PhraseBlock active={stage === "businesses"}>
          <h2 className="text-[clamp(1.9rem,5.2vw,3.75rem)] font-semibold leading-[1.15] tracking-tight text-white">
            <span className="text-connection">{stats.businesses}+</span> empresas no mesmo
            endereço.
          </h2>
        </PhraseBlock>

        <PhraseBlock active={stage === "sectors"}>
          <h2 className="text-[clamp(1.9rem,5.2vw,3.75rem)] font-semibold leading-[1.15] tracking-tight text-white">
            <span className="text-connection">{stats.categories}</span> setores diferentes, sob o
            mesmo teto.
          </h2>
        </PhraseBlock>

        <PhraseBlock active={stage === "connection"}>
          <h2 className="text-[clamp(1.9rem,5.2vw,3.75rem)] font-semibold leading-[1.15] tracking-tight text-white">
            Um único ponto de <span className="text-connection">conexão</span>.
          </h2>
        </PhraseBlock>

        <PhraseBlock active={stage === "disconnected"}>
          <h2 className="text-[clamp(1.9rem,5.2vw,3.75rem)] font-semibold leading-[1.15] tracking-tight text-white">
            Trabalhar perto não significa estar <span className="text-connection">conectado</span>.
          </h2>
        </PhraseBlock>

        <PhraseBlock active={stage === "grow"} large>
          <p className="text-[clamp(2.1rem,6vw,4.5rem)] font-semibold leading-[1.15] tracking-tight text-white">
            Quando os negócios se conectam, todo o ecossistema{" "}
            <span className="text-connection">cresce</span>.
          </p>
        </PhraseBlock>
      </ScrollStage>
    </section>
  );
}
