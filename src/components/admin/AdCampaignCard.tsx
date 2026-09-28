"use client";

import { useState, useTransition } from "react";
import { approveCampaign, rejectCampaign, pauseCampaign, resumeCampaign, toggleBlockAdvertiser } from "@/lib/actions/admin-ads";
import { PHASE_CLASS, PHASE_LABEL, type CampaignPhase } from "@/lib/ads-phase";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatCents, formatDateBR } from "@/lib/utils";
import type { CampaignWithDetails, CampaignMetrics } from "@/lib/services/ads";

type Props = { campaign: CampaignWithDetails; metrics: CampaignMetrics; phase: CampaignPhase };

export function AdCampaignCard({ campaign, metrics, phase }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [reason, setReason] = useState("");
  const isPaused = campaign.status === "paused";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white/80 p-4">
      <div>
        <div className="flex items-start justify-between gap-2">
          <p className="text-[15px] font-semibold leading-snug text-foreground">{campaign.title}</p>
          <StatusBadge label={PHASE_LABEL[phase]} className={`shrink-0 ${PHASE_CLASS[phase]}`} />
        </div>
        <p className="mt-1 text-[13px] text-muted">
          {campaign.advertiserName} · {campaign.placementName}
        </p>
        <p className="text-[13px] text-muted">
          {formatDateBR(campaign.startsAt)} a {formatDateBR(campaign.endsAt)}
        </p>
        {campaign.advertiserBlocked && <p className="mt-1 text-[13px] text-red-600">Anunciante bloqueado</p>}
        {campaign.rejectionReason && <p className="mt-1 text-[13px] text-red-600">Motivo: {campaign.rejectionReason}</p>}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-muted">
        <span>{metrics.impressions} impressões</span>
        <span>{metrics.clicks} cliques</span>
        <span>CTR {metrics.ctr.toFixed(2)}%</span>
        {campaign.negotiatedValueCents != null && (
          <span className="font-medium text-foreground">{formatCents(campaign.negotiatedValueCents)}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
        {(campaign.status === "pending_review" || isPaused) && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => void (isPaused ? resumeCampaign(campaign.id) : approveCampaign(campaign.id)))}
            className="neu-primary rounded-full px-3.5 py-1.5 text-[13px] font-medium text-white disabled:opacity-60"
          >
            {isPaused ? "Reativar" : "Aprovar"}
          </button>
        )}
        {campaign.status === "approved" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => void pauseCampaign(campaign.id))}
            className="neu rounded-full px-3.5 py-1.5 text-[13px] font-medium text-foreground disabled:opacity-60"
          >
            Pausar
          </button>
        )}
        {campaign.status === "pending_review" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => setShowRejectReason((v) => !v)}
            className="neu rounded-full px-3.5 py-1.5 text-[13px] font-medium text-foreground disabled:opacity-60"
          >
            Recusar
          </button>
        )}
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => void toggleBlockAdvertiser(campaign.advertiserId, !campaign.advertiserBlocked))}
          className="rounded-full border border-red-200 px-3.5 py-1.5 text-[13px] font-medium text-red-600 disabled:opacity-60"
        >
          {campaign.advertiserBlocked ? "Desbloquear anunciante" : "Bloquear anunciante"}
        </button>
      </div>

      {showRejectReason && (
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-[13px]"
            placeholder="Motivo da recusa (opcional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => void rejectCampaign(campaign.id, reason))}
            className="rounded-xl bg-red-600 px-3.5 py-2 text-[13px] font-medium text-white disabled:opacity-60"
          >
            Confirmar
          </button>
        </div>
      )}
    </div>
  );
}
