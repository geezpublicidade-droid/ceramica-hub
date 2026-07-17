import { FadeUp } from "@/components/motion/FadeUp";

const nodes = [
  [12, 18], [28, 8], [46, 22], [64, 10], [82, 20],
  [10, 45], [32, 40], [52, 48], [70, 42], [90, 50],
  [18, 72], [38, 80], [58, 74], [76, 82], [92, 76],
] as const;

const connections: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 2], [6, 7],
  [7, 3], [7, 8], [8, 4], [8, 9], [5, 10], [10, 11], [11, 6], [11, 12],
  [12, 7], [12, 13], [13, 8], [13, 14], [14, 9],
];

export function CollectiveMovement() {
  return (
    <section className="relative overflow-hidden bg-surface px-6 py-36 text-foreground">
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-30"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {connections.map(([a, b], index) => (
          <line
            key={index}
            x1={nodes[a][0]}
            y1={nodes[a][1]}
            x2={nodes[b][0]}
            y2={nodes[b][1]}
            stroke="var(--connection)"
            strokeWidth="0.15"
          />
        ))}
        {nodes.map(([x, y], index) => (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="0.6"
            fill="var(--connection)"
            className="animate-node-pulse"
            style={{ animationDelay: `${(index % 5) * 0.6}s` }}
          />
        ))}
      </svg>

      <div className="relative mx-auto max-w-3xl text-center">
        <FadeUp className="max-w-2xl mx-auto text-[clamp(1.75rem,4vw,3rem)] font-semibold leading-tight tracking-tight">
          Um prédio deixa de ser apenas um endereço quando seus negócios começam a se conectar.
        </FadeUp>
        <FadeUp delay={0.15} className="mt-8 text-[16px] leading-relaxed text-muted">
          A Cerâmica Hub nasce para transformar proximidade em visibilidade, colaboração e novas
          oportunidades.
        </FadeUp>
      </div>
    </section>
  );
}
