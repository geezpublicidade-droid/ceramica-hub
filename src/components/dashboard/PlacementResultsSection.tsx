import type { BusinessPlacementResult } from "@/lib/services/placement-metrics";
import { placementCtr } from "@/lib/services/placement-metrics";
import { formatDateBR } from "@/lib/utils";
import { RenewPlacementButton } from "@/components/dashboard/RenewPlacementButton";

type PlacementResultsSectionProps = {
  placements: BusinessPlacementResult[];
  periodLabel: string;
  /** botão de renovação só no painel; o relatório impresso não tem ações */
  allowRenewal?: boolean;
};

const STAT_LABELS: { key: "impressions" | "profileViews" | "cardClicks" | "leads"; label: string }[] = [
  { key: "impressions", label: "Vezes que apareceu" },
  { key: "profileViews", label: "Visitas ao perfil" },
  { key: "cardClicks", label: "Cliques no card" },
  { key: "leads", label: "Contatos gerados" },
];

/** Posição ativa perto do fim, ou já encerrada: momento de oferecer a renovação. */
function canRenew(placement: BusinessPlacementResult): boolean {
  if (placement.liveState === "encerrada") return true;
  return placement.daysLeft !== null && placement.daysLeft <= 15;
}

/** Resultados de cada posição paga da empresa na categoria: só o que veio do destaque, nunca o perfil inteiro. */
export function PlacementResultsSection({ placements, periodLabel, allowRenewal }: PlacementResultsSectionProps) {
  if (placements.length === 0) return null;

  return (
    <section className="glass-light rounded-3xl p-6 print:break-inside-avoid">
      <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">Seus destaques em categorias</p>
      <p className="mt-1 text-[14px] text-muted">Resultados atribuídos a cada posição · {periodLabel}</p>

      <div className="mt-5 flex flex-col gap-5">
        {placements.map((placement) => {
          const ctr = placementCtr(placement.metrics);
          return (
            <article key={placement.id} className="rounded-2xl border border-border bg-white/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[16px] font-semibold text-foreground">{placement.typeName}</p>
                  <p className="text-[13px] text-muted">{placement.categoryLabel}</p>
                  <p className="text-[13px] text-muted">
                    {formatDateBR(placement.startsAt)} a {formatDateBR(placement.endsAt)}
                    {placement.daysLeft !== null && placement.liveState !== "encerrada" && ` · ${placement.daysLeft} dias restantes`}
                  </p>
                </div>
                <span className="rounded-full border border-border px-3 py-1 text-[13px] text-foreground">{placement.liveLabel}</span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {STAT_LABELS.map((stat) => (
                  <div key={stat.key}>
                    <dt className="text-[12px] text-muted">{stat.label}</dt>
                    <dd className="text-[22px] font-semibold text-foreground">{placement.metrics[stat.key]}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-[13px] text-muted">
                WhatsApp {placement.metrics.whatsapp} · Telefone {placement.metrics.phone} · Site {placement.metrics.website} · Como chegar{" "}
                {placement.metrics.directions}
                {ctr !== null && ` · Taxa de cliques ${ctr.toFixed(1)}%`}
              </p>

              {allowRenewal && canRenew(placement) && (
                <div className="mt-4 print:hidden">
                  <RenewPlacementButton
                    message={`Quero renovar a posição ${placement.typeName} em ${placement.categoryLabel} (término em ${formatDateBR(placement.endsAt)}).`}
                  />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
