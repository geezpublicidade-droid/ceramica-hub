import { deltaPercent } from "@/lib/services/business-results";

/** Variação vs. período anterior; sem base de comparação (anterior = 0) só avisa quando há valor atual. */
export function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  const delta = deltaPercent(current, previous);
  if (delta === null) return current > 0 ? <span className="text-[13px] text-muted">sem período anterior para comparar</span> : null;
  const tone = delta > 0 ? "text-green-700" : delta < 0 ? "text-red-700" : "text-muted";
  return (
    <span className={`text-[13px] font-medium ${tone}`}>
      {delta > 0 ? "+" : ""}
      {delta}% vs. período anterior
    </span>
  );
}
