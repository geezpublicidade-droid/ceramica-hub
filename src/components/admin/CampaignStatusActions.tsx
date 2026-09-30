"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMarketingCampaignAction, setMarketingCampaignStatusAction } from "@/lib/actions/marketing-campaigns";
import { CAMPAIGN_STATE_LABEL, type CampaignState } from "@/lib/services/marketing-campaigns";

/** Próximos passos possíveis a partir de cada estado do fluxo
 * rascunho → aprovação → ativa → encerrada. */
const NEXT_STATES: Record<CampaignState, CampaignState[]> = {
  rascunho: ["aguardando_aprovacao", "cancelada"],
  aguardando_aprovacao: ["aprovada", "rascunho", "cancelada"],
  aprovada: ["ativa", "cancelada"],
  ativa: ["encerrada", "cancelada"],
  encerrada: [],
  cancelada: ["rascunho"],
};

export function CampaignStatusActions({ campaignId, status }: { campaignId: string; status: CampaignState }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ success: boolean; error?: string }>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.success) setError(result.error ?? "Não foi possível concluir.");
        else (after ?? router.refresh)();
      } catch {
        setError("Não foi possível concluir agora.");
      }
    });
  }

  function handleDelete() {
    if (!window.confirm("Excluir esta campanha? Peças, disparos e anúncios vinculados continuam existindo.")) return;
    run(
      () => deleteMarketingCampaignAction(campaignId),
      () => router.push("/admin/marketing/campanhas"),
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {NEXT_STATES[status].map((next) => (
          <button
            key={next}
            type="button"
            disabled={isPending}
            onClick={() => run(() => setMarketingCampaignStatusAction(campaignId, next))}
            className="neu rounded-full px-4 py-2 text-[13px] font-medium text-foreground disabled:opacity-60"
          >
            → {CAMPAIGN_STATE_LABEL[next]}
          </button>
        ))}
        <button
          type="button"
          disabled={isPending}
          onClick={handleDelete}
          className="rounded-full border border-danger/30 px-4 py-2 text-[13px] font-medium text-danger disabled:opacity-60"
        >
          Excluir
        </button>
      </div>
      {error && <p className="text-[13px] text-danger">{error}</p>}
    </div>
  );
}
