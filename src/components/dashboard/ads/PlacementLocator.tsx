import { locationFor } from "@/lib/ad-locations";

/** Mini-esboço da página com o espaço do anúncio destacado: mostra à empresa ONDE o anúncio vai aparecer. */
export function PlacementLocator({ placementKey, label }: { placementKey: string; label: string }) {
  const { wireframe, highlight } = locationFor(placementKey);
  return (
    <figure className="w-full max-w-[220px]">
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label={`Esboço da página ${wireframe.title} com o espaço ${label} destacado`}
        className="w-full rounded-xl border border-border bg-white"
      >
        {wireframe.blocks.map((block) => {
          const active = block.id === highlight;
          return (
            <g key={block.id}>
              <rect
                x={block.x + 1}
                y={block.y + 0.5}
                width={Math.max(block.w - 2, 1)}
                height={Math.max(block.h - 1, 1)}
                rx={1.5}
                className={active ? "fill-[var(--color-primary,#b4552d)]" : "fill-[#ece7e1]"}
              />
              {(active || block.h >= 9) && block.label && (
                <text
                  x={block.x + block.w / 2}
                  y={block.y + block.h / 2 + 1.5}
                  textAnchor="middle"
                  fontSize={active ? 4.4 : 3.6}
                  className={active ? "fill-white font-semibold" : "fill-[#8a8178]"}
                >
                  {active ? "SEU ANÚNCIO" : block.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-1 text-center text-[12px] text-muted">{wireframe.title}</figcaption>
    </figure>
  );
}
