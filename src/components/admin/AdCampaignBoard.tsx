"use client";

import { AdCampaignCard } from "@/components/admin/AdCampaignCard";
import { PHASE_LABEL, PHASE_ORDER, type CampaignPhase } from "@/lib/ads-phase";
import type { CampaignWithDetails, CampaignMetrics } from "@/lib/services/ads";

type Row = { campaign: CampaignWithDetails; metrics: CampaignMetrics; phase: CampaignPhase };

/** Board tipo Kanban -- uma coluna por fase, todas sempre visíveis (mesmo
 * vazias) pra dar a leitura completa do funil comercial de uma vez, sem
 * precisar trocar de filtro. Scroll horizontal em telas menores.
 *
 * `phase` já vem calculada pelo server (page.tsx) em vez de ser recomputada
 * aqui -- evita que o corte "hoje" usado pra separar agendada/ativa/
 * concluída divirja entre o SSR (resumo financeiro) e o client (este board),
 * e faz o agrupamento num único passe em vez de um filter por coluna. */
export function AdCampaignBoard({ rows }: { rows: Row[] }) {
  const grouped = new Map<CampaignPhase, Row[]>(PHASE_ORDER.map((phase) => [phase, []]));
  for (const row of rows) grouped.get(row.phase)!.push(row);

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {PHASE_ORDER.map((phase) => {
        const phaseRows = grouped.get(phase)!;
        return (
          <div key={phase} className="flex w-[280px] shrink-0 flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-muted">{PHASE_LABEL[phase]}</p>
              <span className="rounded-full bg-muted/15 px-2 py-0.5 text-[12px] font-medium text-muted">{phaseRows.length}</span>
            </div>
            <div className="flex flex-col gap-3">
              {phaseRows.length === 0 && (
                <p className="rounded-2xl border border-dashed border-border p-4 text-center text-[13px] text-muted">
                  Nenhuma campanha
                </p>
              )}
              {phaseRows.map(({ campaign, metrics, phase: rowPhase }) => (
                <AdCampaignCard key={campaign.id} campaign={campaign} metrics={metrics} phase={rowPhase} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
