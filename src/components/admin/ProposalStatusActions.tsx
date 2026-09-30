"use client";

import { useState, useTransition } from "react";
import { setProposalStatusAction } from "@/lib/actions/proposals";
import { FINAL_STATUSES, PROPOSAL_STATUS_LABEL, type ProposalStatus } from "@/lib/services/proposals";

const MOVES: Partial<Record<ProposalStatus, ProposalStatus[]>> = {
  rascunho: ["enviada"],
  enviada: ["negociacao", "aceita", "recusada"],
  visualizada: ["negociacao", "aceita", "recusada"],
  negociacao: ["aceita", "recusada"],
};

const MOVE_CLASS: Partial<Record<ProposalStatus, string>> = {
  aceita: "neu-primary text-white",
  recusada: "neu text-red-600",
};

export function ProposalStatusActions({ proposalId, status }: { proposalId: string; status: ProposalStatus }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");

  if (FINAL_STATUSES.includes(status)) return null;

  function move(next: ProposalStatus) {
    setError(null);
    startTransition(async () => {
      const result = await setProposalStatusAction(proposalId, next, note);
      if (!result.success) return setError(result.error);
      setNote("");
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white/70 p-4">
      <input
        className="rounded-xl border border-border bg-white px-4 py-2 text-[14px]"
        placeholder="Nota da mudança (opcional — ex.: motivo da recusa)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        {(MOVES[status] ?? []).map((next) => (
          <button
            key={next}
            type="button"
            disabled={isPending}
            onClick={() => move(next)}
            className={`rounded-full px-4 py-2 text-[14px] font-medium disabled:opacity-60 ${MOVE_CLASS[next] ?? "neu text-foreground"}`}
          >
            {next === "enviada" ? "Marcar como enviada" : `Mover para ${PROPOSAL_STATUS_LABEL[next]}`}
          </button>
        ))}
      </div>
      {error && <p className="text-[14px] text-red-600">{error}</p>}
    </div>
  );
}
