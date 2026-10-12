"use client";

import { useTransition } from "react";
import { cancelMyAdBooking } from "@/lib/actions/ad-store";
import { campaignStage, type StageTone } from "@/lib/ad-stage";
import type { MyCampaign } from "@/lib/services/ad-store";
import { formatCents, formatDateBR } from "@/lib/utils";

const TONE_CLASS: Record<StageTone, string> = {
  green: "bg-emerald-100 text-emerald-800",
  blue: "bg-sky-100 text-sky-800",
  yellow: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
  gray: "bg-stone-200 text-stone-700",
};

/** Agenda da empresa: o que está no ar, agendado, aguardando e encerrado, com resultado de cada campanha. */
export function MyCampaignsList({ campaigns, today, canCancel }: { campaigns: MyCampaign[]; today: string; canCancel: boolean }) {
  const [isPending, startTransition] = useTransition();
  if (campaigns.length === 0) return null;

  return (
    <section className="glass-card-light rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-foreground">Minha agenda de divulgação</h2>
      <ul className="mt-4 divide-y divide-border">
        {campaigns.map((campaign) => {
          const stage = campaignStage(campaign, today);
          const cancellable = canCancel && campaign.status === "pending_review" && campaign.paymentStatus === "pendente";
          return (
            <li key={campaign.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
              <div className="min-w-0">
                <p className="text-[16px] font-medium text-foreground">{campaign.title}</p>
                <p className="text-[14px] text-muted">
                  {campaign.placementName} · {formatDateBR(campaign.startsAt)} a {formatDateBR(campaign.endsAt)}
                  {campaign.priceCents != null && ` · ${formatCents(campaign.priceCents)}`}
                </p>
                {campaign.rejectionReason && <p className="text-[14px] text-red-700">Motivo: {campaign.rejectionReason}</p>}
                {campaign.metrics.impressions > 0 && (
                  <p className="text-[13px] text-muted">
                    {campaign.metrics.impressions} exibições · {campaign.metrics.clicks} cliques · CTR {campaign.metrics.ctr.toFixed(2)}%
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-[13px] font-medium ${TONE_CLASS[stage.tone]}`}>{stage.label}</span>
                {cancellable && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => startTransition(() => void cancelMyAdBooking(campaign.id))}
                    className="text-[13px] font-medium text-red-700 underline disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
