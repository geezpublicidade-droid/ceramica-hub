"use client";

import { useState } from "react";
import type { DailyTrendPoint } from "@/lib/services/results";

/** Gráfico de linha (SVG puro, sem lib nova) com a evolução diária real de
 * visualizações e cliques de WhatsApp -- ver skill `dataviz` carregada antes
 * de escrever isto: paleta terracota/teal validada (CVD ΔE 20.9, dentro do
 * aceitável), rótulo direto no fim de cada linha porque o teal fica abaixo de
 * 3:1 de contraste no fundo claro (WARN do validador -- não dá pra confiar só
 * na cor), legenda porque são 2 séries, crosshair+tooltip no hover. */

const WIDTH = 720;
const HEIGHT = 240;
const PADDING = { top: 16, right: 16, bottom: 28, left: 40 };

// Hex literal (não var(--...)) -- suporte a custom property em atributo de
// apresentação SVG (fill/stroke) é inconsistente entre navegadores, então
// usamos o valor resolvido dos tokens terracota/teal do globals.css.
const SERIES = [
  { key: "pageViews" as const, label: "Visualizações", color: "#b3553a" },
  { key: "whatsappClicks" as const, label: "Cliques WhatsApp", color: "#1ea6d3" },
];

function formatDayShort(day: string): string {
  const [, month, date] = day.split("-");
  return `${date}/${month}`;
}

export function ResultsTrendChart({ points }: { points: DailyTrendPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxValue = Math.max(1, ...points.map((p) => Math.max(p.pageViews, p.whatsappClicks)));
  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const xFor = (i: number) => PADDING.left + (points.length > 1 ? (i / (points.length - 1)) * innerWidth : innerWidth / 2);
  const yFor = (value: number) => PADDING.top + innerHeight - (value / maxValue) * innerHeight;

  const lines = SERIES.map((series) => ({
    ...series,
    path: points.map((p, i) => `${i === 0 ? "M" : "L"}${xFor(i)},${yFor(p[series.key])}`).join(" "),
    lastValue: points[points.length - 1]?.[series.key] ?? 0,
  }));

  const gridLines = [0, 0.5, 1].map((fraction) => ({
    y: PADDING.top + innerHeight * (1 - fraction),
    value: Math.round(maxValue * fraction),
  }));

  // Poucas labels no eixo X pra não empilhar texto -- início, meio e fim.
  const xTickIndices = points.length <= 1 ? [0] : [0, Math.floor((points.length - 1) / 2), points.length - 1];

  function handleMove(e: React.MouseEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const ratio = Math.min(1, Math.max(0, (relativeX - PADDING.left) / innerWidth));
    const index = Math.round(ratio * (points.length - 1));
    setHoverIndex(Math.min(points.length - 1, Math.max(0, index)));
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const tooltipLeft = hoverIndex !== null ? (xFor(hoverIndex) / WIDTH) * 100 : 0;
  const tooltipAlignRight = tooltipLeft > 65;

  if (points.every((p) => p.pageViews === 0 && p.whatsappClicks === 0)) {
    return <p className="rounded-2xl border border-dashed border-border p-6 text-center text-[14px] text-muted">Sem eventos registrados no período.</p>;
  }

  return (
    <div className="rounded-2xl border border-border bg-white/60 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-4">
        {lines.map((series) => (
          <div key={series.key} className="flex items-center gap-1.5 text-[13px] text-muted">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: series.color }} />
            {series.label} <span className="font-medium text-foreground">({series.lastValue} no último dia)</span>
          </div>
        ))}
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ height: "auto" }}>
          {gridLines.map((line) => (
            <g key={line.value}>
              <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={line.y} y2={line.y} stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
              <text x={PADDING.left - 8} y={line.y} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#86868b">
                {line.value}
              </text>
            </g>
          ))}

          {xTickIndices.map((i) => (
            <text key={i} x={xFor(i)} y={HEIGHT - 8} textAnchor="middle" fontSize={11} fill="#86868b">
              {formatDayShort(points[i].day)}
            </text>
          ))}

          {lines.map((series) => (
            <path key={series.key} d={series.path} fill="none" stroke={series.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          ))}

          {hoverIndex !== null && (
            <line
              x1={xFor(hoverIndex)}
              x2={xFor(hoverIndex)}
              y1={PADDING.top}
              y2={HEIGHT - PADDING.bottom}
              stroke="#2e2e2e"
              strokeOpacity={0.25}
              strokeWidth={1}
            />
          )}

          {hoverIndex !== null &&
            lines.map((series) => (
              <circle
                key={series.key}
                cx={xFor(hoverIndex)}
                cy={yFor(points[hoverIndex][series.key])}
                r={4}
                fill={series.color}
                stroke="white"
                strokeWidth={1.5}
              />
            ))}

          <rect
            x={PADDING.left}
            y={PADDING.top}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            onMouseMove={handleMove}
            onMouseLeave={() => setHoverIndex(null)}
          />
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute top-2 rounded-xl border border-border bg-white px-3 py-2 text-[12px] shadow-lg"
            style={tooltipAlignRight ? { right: `${100 - tooltipLeft}%`, marginRight: 8 } : { left: `${tooltipLeft}%`, marginLeft: 8 }}
          >
            <p className="font-medium text-foreground">{formatDayShort(hovered.day)}</p>
            {SERIES.map((series) => (
              <p key={series.key} className="flex items-center gap-1.5 text-muted">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: series.color }} />
                {series.label}: <span className="font-medium text-foreground">{hovered[series.key]}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
