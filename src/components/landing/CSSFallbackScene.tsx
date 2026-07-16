"use client";

import { useEffect, useRef } from "react";
import { useScrollProgress } from "@/components/motion/ScrollStage";

type Point = { x: number; y: number; threshold: number };

/**
 * Posições em % sobre a foto do Espaço Cerâmica — concentradas na metade
 * direita do quadro (torre secundária + céu), longe da área onde o texto
 * do hero fica (metade esquerda). Cada ponto representa uma empresa que
 * "acende" progressivamente com o scroll.
 */
const RAW_POINTS: [number, number][] = [
  [54, 10], [62, 7], [70, 12], [78, 8], [86, 14], [94, 10],
  [58, 20], [66, 24], [74, 18], [82, 22], [90, 26],
  [54, 32], [62, 36], [70, 30], [78, 34], [86, 30],
  [58, 42], [74, 42],
];

const POINTS: Point[] = RAW_POINTS.map(([x, y], index) => ({
  x,
  y,
  threshold: (index / (RAW_POINTS.length - 1)) * 0.55,
}));

/** conexões curadas entre pontos próximos — não é malha completa */
const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
  [0, 6], [2, 8], [4, 10],
  [6, 7], [7, 8], [8, 9], [9, 10],
  [6, 11], [7, 13], [9, 15],
  [11, 12], [13, 14], [14, 15],
  [11, 16], [13, 17], [14, 17],
];

function curvePath(a: Point, b: Point) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - 3;
  return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
}

/**
 * Camada abstrata (sem WebGL) que acende pontos sobre a foto real do
 * Espaço Cerâmica e desenha conexões orgânicas entre eles — usada quando
 * não há WebGL, o dispositivo é considerado fraco, ou prefers-reduced-motion.
 * Sincronizada ao progresso de scroll via uma única custom property CSS
 * (`--p`), atualizada por frame, sem recalcular nada em React.
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
      className="absolute inset-0 overflow-hidden"
      style={{ ["--p" as string]: 0 }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(55% 45% at 50% 30%, var(--glow), transparent 70%)",
          opacity: "calc(0.15 + var(--p) * 0.3)",
        }}
      />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        fill="none"
      >
        <g style={{ opacity: "clamp(0, calc((var(--p) - 0.58) / 0.4 * 0.6), 0.6)" }}>
          {CONNECTIONS.map(([a, b], index) => (
            <path
              key={index}
              d={curvePath(POINTS[a], POINTS[b])}
              stroke="var(--connection)"
              strokeWidth="0.12"
              strokeLinecap="round"
            />
          ))}
        </g>
      </svg>

      {POINTS.map((point, index) => {
        const activation = `clamp(0, calc((var(--p) - ${point.threshold} + 0.08) / 0.16), 1)`;
        return (
          <div
            key={index}
            className="absolute h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-connection"
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              opacity: activation,
              boxShadow: "0 0 8px var(--glow)",
            }}
          />
        );
      })}
    </div>
  );
}
