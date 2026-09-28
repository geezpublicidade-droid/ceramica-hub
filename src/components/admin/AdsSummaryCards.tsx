import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { formatCents } from "@/lib/utils";

type Props = {
  mrrActiveCents: number;
  negotiatedActiveCents: number;
  ctr30d: number;
  pendingReviewCount: number;
};

/** Resumo comercial no topo do board de publicidade -- mesmo `AdminStatCard`
 * usado na home do /admin. */
export function AdsSummaryCards({ mrrActiveCents, negotiatedActiveCents, ctr30d, pendingReviewCount }: Props) {
  const cards = [
    { label: "MRR ativo (posições ocupadas)", value: formatCents(mrrActiveCents), highlight: false },
    { label: "Negociado em campanhas ativas", value: formatCents(negotiatedActiveCents), highlight: false },
    { label: "CTR médio (30 dias)", value: `${ctr30d.toFixed(2)}%`, highlight: false },
    { label: "Aguardando revisão", value: String(pendingReviewCount), highlight: pendingReviewCount > 0 },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <AdminStatCard key={card.label} label={card.label} value={card.value} highlight={card.highlight} />
      ))}
    </div>
  );
}
