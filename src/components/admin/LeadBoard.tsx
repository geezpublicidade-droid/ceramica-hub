"use client";

import { LeadCard } from "@/components/admin/LeadCard";
import { LEAD_STAGE_LABEL, LEAD_STAGE_ORDER, type Lead } from "@/lib/services/leads";
import type { AssignableAdmin } from "@/lib/services/admins";

type Props = { leads: Lead[]; admins: AssignableAdmin[]; businesses: { id: string; name: string }[] };

/** Board Kanban do funil comercial -- mesmo padrão visual do board de
 * publicidade (AdCampaignBoard): uma coluna por estágio, sempre visíveis. */
export function LeadBoard({ leads, admins, businesses }: Props) {
  const grouped = new Map<string, Lead[]>(LEAD_STAGE_ORDER.map((stage) => [stage, []]));
  for (const lead of leads) grouped.get(lead.stage)?.push(lead);

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {LEAD_STAGE_ORDER.map((stage) => {
        const stageLeads = grouped.get(stage) ?? [];
        return (
          <div key={stage} className="flex w-[300px] shrink-0 flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-muted">{LEAD_STAGE_LABEL[stage]}</p>
              <span className="rounded-full bg-muted/15 px-2 py-0.5 text-[12px] font-medium text-muted">{stageLeads.length}</span>
            </div>
            <div className="flex flex-col gap-3">
              {stageLeads.length === 0 && (
                <p className="rounded-2xl border border-dashed border-border p-4 text-center text-[13px] text-muted">
                  Nenhum lead
                </p>
              )}
              {stageLeads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} admins={admins} businesses={businesses} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
