"use client";

import { createContext, useContext, useEffect, useRef, type MutableRefObject, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/hooks/useReducedMotion";

let pluginsRegistered = false;
function ensureGsapPlugins() {
  if (!pluginsRegistered) {
    gsap.registerPlugin(ScrollTrigger);
    pluginsRegistered = true;
  }
}

type ProgressRef = MutableRefObject<number>;

const ScrollStageContext = createContext<ProgressRef | null>(null);

/**
 * Progresso de scroll (0→1) da narrativa como ref mutável — pensado pra ser lido
 * dentro de `useFrame` (R3F) sem disparar re-render a cada frame.
 */
export function useScrollProgress(): ProgressRef {
  const ctx = useContext(ScrollStageContext);
  if (!ctx) {
    throw new Error("useScrollProgress precisa ser usado dentro de um <ScrollStage>");
  }
  return ctx;
}

type ScrollStageProps = {
  children: ReactNode;
  /** altura do trecho de scroll que alimenta a narrativa, em svh */
  heightVh?: number;
  /** chamado a cada atualização de progresso — deve ser memoizado pelo caller */
  onProgress?: (progress: number) => void;
  className?: string;
};

export function ScrollStage({ children, heightVh = 500, onProgress, className }: ScrollStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      progressRef.current = 1;
      onProgress?.(1);
      return;
    }

    ensureGsapPlugins();
    const container = containerRef.current;
    if (!container) return;

    const trigger = ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        progressRef.current = self.progress;
        onProgress?.(self.progress);
      },
    });

    return () => {
      trigger.kill();
    };
  }, [reducedMotion, onProgress]);

  return (
    <ScrollStageContext.Provider value={progressRef}>
      <div
        ref={containerRef}
        className={className}
        style={reducedMotion ? undefined : { height: `${heightVh}svh` }}
      >
        <div className={reducedMotion ? "relative overflow-hidden" : "sticky top-0 h-[100svh] overflow-hidden"}>
          {children}
        </div>
      </div>
    </ScrollStageContext.Provider>
  );
}
