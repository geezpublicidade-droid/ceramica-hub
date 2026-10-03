"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  renewPlacementAction,
  reorderPlacementAction,
  setPlacementPaymentAction,
  setPlacementStatusAction,
} from "@/lib/actions/admin-category-placements";
import {
  PAYMENT_STATUS_LABEL,
  PLACEMENT_LIVE_LABEL,
  type AdminPlacement,
  type PaymentStatus,
  type PlacementStatus,
} from "@/lib/services/category-placements-admin";
import { formatCents, formatDateBR } from "@/lib/utils";

const LIVE_TONE: Record<AdminPlacement["liveState"], string> = {
  no_ar: "bg-emerald-50 text-emerald-800 border-emerald-200",
  agendada: "bg-sky-50 text-sky-800 border-sky-200",
  vencendo: "bg-amber-50 text-amber-800 border-amber-200",
  aguardando: "bg-orange-50 text-orange-800 border-orange-200",
  suspensa: "bg-stone-100 text-stone-700 border-stone-200",
  encerrada: "bg-stone-50 text-stone-500 border-stone-200",
};

const smallButton = "rounded-full border border-border bg-white px-3 py-1.5 text-[13px] font-medium text-foreground hover:border-primary/40 disabled:opacity-50";

/** Linha de uma posição: situação real hoje, resultados e ações (liberar, suspender, renovar, pagamento, ordem/peso). */
export function CategoryPlacementRow({ placement }: { placement: AdminPlacement }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState(String(placement.position));
  const [weight, setWeight] = useState(String(placement.rotationWeight));

  function run(task: () => Promise<{ success: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await task();
        if (!result.success) setError(result.error ?? "Não foi possível concluir.");
        else router.refresh();
      } catch {
        setError("Não foi possível concluir agora. Tente de novo.");
      }
    });
  }

  const setStatus = (status: PlacementStatus) => run(() => setPlacementStatusAction(placement.id, status));
  const closed = placement.liveState === "encerrada";
  const ctr = placement.impressions > 0 ? ((placement.clicks / placement.impressions) * 100).toFixed(1) : "—";

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-white/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[16px] font-semibold text-foreground">{placement.businessName}</p>
          <p className="text-[13px] text-muted">
            {placement.typeName} · {placement.categoryLabel}
          </p>
          <p className="text-[13px] text-muted">
            {formatDateBR(placement.startsAt)} a {formatDateBR(placement.endsAt)}
            {placement.amountCents != null && ` · ${formatCents(placement.amountCents)}`}
            {placement.contractRef && ` · contrato ${placement.contractRef}`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`rounded-full border px-3 py-1 text-[13px] font-medium ${LIVE_TONE[placement.liveState]}`}>
            {PLACEMENT_LIVE_LABEL[placement.liveState]}
          </span>
          <span className="text-[12px] text-muted">
            {placement.impressions} impressões · {placement.clicks} cliques · CTR {ctr}
            {ctr !== "—" && "%"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-[13px] text-muted">
          Pagamento
          <select
            className="rounded-lg border border-border bg-white px-2 py-1.5 text-[13px] text-foreground"
            value={placement.paymentStatus}
            disabled={isPending}
            onChange={(e) => run(() => setPlacementPaymentAction(placement.id, e.target.value as PaymentStatus))}
          >
            {(Object.keys(PAYMENT_STATUS_LABEL) as PaymentStatus[]).map((status) => (
              <option key={status} value={status}>
                {PAYMENT_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </label>

        {!closed && placement.status !== "active" && (
          <button type="button" className={smallButton} disabled={isPending} onClick={() => setStatus("active")}>
            Liberar
          </button>
        )}
        {placement.status === "active" && (
          <button type="button" className={smallButton} disabled={isPending} onClick={() => setStatus("paused")}>
            Suspender
          </button>
        )}
        {[1, 3, 6, 12].map((months) => (
          <button key={months} type="button" className={smallButton} disabled={isPending} onClick={() => run(() => renewPlacementAction(placement.id, months))}>
            Renovar {months}m
          </button>
        ))}
        {!closed && (
          <button type="button" className={`${smallButton} text-red-700`} disabled={isPending} onClick={() => setStatus("cancelled")}>
            Cancelar
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[13px] text-muted">
        <label className="flex items-center gap-2">
          Ordem
          <input type="number" min={0} value={position} onChange={(e) => setPosition(e.target.value)} className="w-16 rounded-lg border border-border bg-white px-2 py-1 text-foreground" />
        </label>
        <label className="flex items-center gap-2">
          Peso
          <input type="number" min={1} max={10} value={weight} onChange={(e) => setWeight(e.target.value)} className="w-16 rounded-lg border border-border bg-white px-2 py-1 text-foreground" />
        </label>
        <button
          type="button"
          className={smallButton}
          disabled={isPending}
          onClick={() => run(() => reorderPlacementAction(placement.id, Number(position), Number(weight)))}
        >
          Salvar ordem e peso
        </button>
      </div>
      {error && <p className="text-[13px] text-red-700">{error}</p>}
    </article>
  );
}
