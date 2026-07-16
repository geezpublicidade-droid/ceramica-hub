"use client";

import { useEffect, useRef } from "react";
import { useScrollProgress } from "@/components/motion/ScrollStage";

const FLOOR_COUNT = 9;
const NODES_PER_FLOOR = 6;

type TowerNode = { floor: number; index: number; threshold: number };

const NODES: TowerNode[] = Array.from({ length: FLOOR_COUNT }, (_, floor) =>
  Array.from({ length: NODES_PER_FLOOR }, (_, index) => ({ floor, index }))
)
  .flat()
  .map((node, position, all) => ({ ...node, threshold: (position / (all.length - 1)) * 0.55 }));

/**
 * Versão CSS/SVG do "prédio que acende" — usada quando não há WebGL, o
 * dispositivo é considerado fraco, ou o usuário pediu prefers-reduced-motion.
 * Sincronizada ao mesmo progresso de scroll da cena 3D via uma única custom
 * property CSS (`--p`), atualizada por frame — sem recalcular nada em React.
 */
export function CSSFallbackScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useScrollProgress();

  useEffect(() => {
    let frame: number;
    const container = containerRef.current;

    const tick = () => {
      if (container) {
        container.style.setProperty("--p", progressRef.current.toString());
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [progressRef]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      role="presentation"
      className="absolute inset-0 overflow-hidden bg-surface-dark"
      style={{ ["--p" as string]: 0 }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(60% 50% at 50% 45%, var(--glow), transparent 70%)",
          opacity: "calc(0.25 + var(--p) * 0.45)",
        }}
      />

      <div
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col-reverse gap-[10px]"
        style={{ transform: "translate(-50%, -50%) perspective(1200px) rotateX(4deg)" }}
      >
        {Array.from({ length: FLOOR_COUNT }).map((_, floor) => {
          const offset = Math.sin(floor * 1.3) * 10;
          return (
            <div
              key={floor}
              className="flex items-center justify-center gap-[8px]"
              style={{ transform: `translateX(${offset}px)` }}
            >
              {NODES.filter((node) => node.floor === floor).map((node) => {
                const activation = `clamp(0, calc((var(--p) - ${node.threshold} + 0.08) / 0.16), 1)`;
                return (
                  <div
                    key={node.index}
                    className="h-[10px] w-[16px] rounded-[2px] bg-[#1c2430]"
                    style={{
                      position: "relative",
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-[2px] bg-connection"
                      style={{
                        opacity: activation,
                        boxShadow: `0 0 8px var(--glow)`,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <svg
        className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2"
        style={{ opacity: "clamp(0, (var(--p) - 0.58) / 0.4, 1)" }}
        viewBox="0 0 100 100"
        fill="none"
      >
        <line x1="20" y1="80" x2="80" y2="20" stroke="var(--connection)" strokeWidth="0.4" />
        <line x1="20" y1="20" x2="80" y2="80" stroke="var(--connection)" strokeWidth="0.4" />
        <line x1="10" y1="50" x2="90" y2="50" stroke="var(--connection)" strokeWidth="0.4" />
        <line x1="50" y1="10" x2="50" y2="90" stroke="var(--connection)" strokeWidth="0.4" />
      </svg>
    </div>
  );
}
