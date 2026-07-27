"use client";

import { useState, useTransition } from "react";
import { setBusinessFounder, grantTrial, getBusinessHistory, type BusinessHistoryEntry } from "@/lib/actions/admin-business";

type ApprovedBusiness = {
  id: string;
  name: string;
  towerName: string | null;
  floor: string;
  roomNumber: string;
  founder: boolean;
  plan: "presenca" | "profissional" | "destaque" | "experiencia";
  trialStatus: "none" | "active" | "expired";
};

const ACTION_LABEL: Record<string, string> = {
  approve_business: "Aprovação",
  reject_business: "Rejeição",
  set_business_founder: "Alteração de selo Fundadora",
  grant_trial: "Liberação de trial",
};

export function ApprovedBusinessRow({ business }: { business: ApprovedBusiness }) {
  const [isPending, startTransition] = useTransition();
  const [trialError, setTrialError] = useState<string | null>(null);
  const [history, setHistory] = useState<BusinessHistoryEntry[] | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const eligibleForTrial = business.plan === "presenca" && business.trialStatus !== "active";

  async function handleToggleHistory() {
    if (history !== null) {
      setHistory(null);
      return;
    }
    setLoadingHistory(true);
    const entries = await getBusinessHistory(business.id);
    setHistory(entries);
    setLoadingHistory(false);
  }

  return (
    <div className="rounded-2xl border border-border bg-white/60 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px] text-muted">
          {business.name} — {business.towerName ?? "torre não informada"} · {business.floor} · sala{" "}
          {business.roomNumber}
        </p>
        <div className="flex items-center gap-3">
          {eligibleForTrial && (
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  setTrialError(null);
                  const result = await grantTrial(business.id);
                  if (!result.success) setTrialError(result.error);
                })
              }
              className="rounded-full border border-border px-3 py-1.5 text-[12px] font-medium text-foreground disabled:opacity-60"
            >
              Liberar trial
            </button>
          )}
          <button
            type="button"
            onClick={handleToggleHistory}
            className="text-[12px] font-medium text-primary underline"
          >
            {history !== null ? "Ocultar histórico" : "Ver histórico"}
          </button>
          <label className="flex items-center gap-2 text-[13px] text-muted">
            <input
              type="checkbox"
              checked={business.founder}
              disabled={isPending}
              onChange={(e) => startTransition(() => void setBusinessFounder(business.id, e.target.checked))}
            />
            Empresa Fundadora
          </label>
        </div>
      </div>

      {trialError && <p className="mt-2 text-[13px] text-red-600">{trialError}</p>}

      {history !== null && (
        <div className="mt-3 rounded-xl border border-border bg-white/70 p-3">
          {loadingHistory ? (
            <p className="text-[13px] text-muted">Carregando...</p>
          ) : history.length === 0 ? (
            <p className="text-[13px] text-muted">Nenhuma ação administrativa registrada ainda.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {history.map((entry) => (
                <li key={entry.id} className="text-[13px] text-muted">
                  {new Date(entry.createdAt).toLocaleString("pt-BR")} — {ACTION_LABEL[entry.action] ?? entry.action}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
