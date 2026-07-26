"use client";

import { useState, useTransition } from "react";
import { approveCampaign, rejectCampaign, pauseCampaign, resumeCampaign, toggleBlockAdvertiser } from "@/lib/actions/admin-ads";
import type { CampaignWithDetails, CampaignMetrics } from "@/lib/services/ads";

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  pending_review: "Aguardando revisão",
  approved: "Aprovada",
  scheduled: "Agendada",
  active: "Ativa",
  paused: "Pausada",
  completed: "Concluída",
  rejected: "Recusada",
};

export function AdCampaignRow({ campaign, metrics }: { campaign: CampaignWithDetails; metrics: CampaignMetrics }) {
  const [isPending, startTransition] = useTransition();
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <div className="rounded-2xl border border-border bg-white/70 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[17px] font-semibold text-foreground">{campaign.title}</p>
          <p className="text-[15px] text-muted">
            {campaign.advertiserName} · {campaign.placementName} · {campaign.startsAt} a {campaign.endsAt}
          </p>
          <p className="mt-1 text-[14px] text-muted">
            Status: <span className="font-medium text-foreground">{STATUS_LABEL[campaign.status] ?? campaign.status}</span>
            {campaign.advertiserBlocked && <span className="ml-2 text-red-600">(anunciante bloqueado)</span>}
          </p>
          <p className="mt-1 text-[14px] text-muted">
            {metrics.impressions} impressões · {metrics.clicks} cliques · CTR {metrics.ctr.toFixed(2)}%
          </p>
          {campaign.rejectionReason && <p className="mt-1 text-[14px] text-red-600">Motivo: {campaign.rejectionReason}</p>}
        </div>

        <div className="flex flex-wrap gap-2">
          {(campaign.status === "pending_review" || campaign.status === "paused") && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => void (campaign.status === "paused" ? resumeCampaign(campaign.id) : approveCampaign(campaign.id)))}
              className="neu-primary rounded-full px-4 py-2 text-[15px] font-medium text-white disabled:opacity-60"
            >
              {campaign.status === "paused" ? "Reativar" : "Aprovar"}
            </button>
          )}
          {campaign.status === "approved" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => void pauseCampaign(campaign.id))}
              className="neu rounded-full px-4 py-2 text-[15px] font-medium text-foreground disabled:opacity-60"
            >
              Pausar
            </button>
          )}
          {campaign.status === "pending_review" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => setShowRejectReason((v) => !v)}
              className="neu rounded-full px-4 py-2 text-[15px] font-medium text-foreground disabled:opacity-60"
            >
              Recusar
            </button>
          )}
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => void toggleBlockAdvertiser(campaign.advertiserId, !campaign.advertiserBlocked))}
            className="rounded-full border border-red-200 px-4 py-2 text-[15px] font-medium text-red-600 disabled:opacity-60"
          >
            {campaign.advertiserBlocked ? "Desbloquear anunciante" : "Bloquear anunciante"}
          </button>
        </div>
      </div>

      {showRejectReason && (
        <div className="mt-4 flex gap-2">
          <input
            className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-[15px]"
            placeholder="Motivo da recusa (opcional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => void rejectCampaign(campaign.id, reason))}
            className="rounded-xl bg-red-600 px-4 py-2 text-[15px] font-medium text-white disabled:opacity-60"
          >
            Confirmar recusa
          </button>
        </div>
      )}
    </div>
  );
}
