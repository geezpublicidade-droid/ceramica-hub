"use client";

import { useState, useTransition } from "react";
import { resolveDataDeletionRequest } from "@/lib/actions/admin-lgpd";
import type { PendingDeletionRequest } from "@/lib/services/platform";

export function AdminDeletionRequestRow({ request }: { request: PendingDeletionRequest }) {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");

  return (
    <div className="rounded-2xl border border-border bg-white/70 p-5">
      <p className="text-[15px] font-semibold text-foreground">{request.businessName}</p>
      {request.reason && <p className="mt-1 text-[13px] text-muted">Motivo: {request.reason}</p>}
      <p className="mt-1 text-[12px] text-muted">
        Solicitado em {new Date(request.requestedAt).toLocaleDateString("pt-BR")}
      </p>

      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Observações (opcional)"
        className="mt-3 w-full rounded-xl border border-border bg-white px-3 py-2 text-[13px]"
      />

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(() => {
              void resolveDataDeletionRequest(request.id, true, notes);
            })
          }
          className="rounded-full bg-red-600 px-4 py-2 text-[13px] font-medium text-white disabled:opacity-60"
        >
          Confirmar exclusão
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(() => {
              void resolveDataDeletionRequest(request.id, false, notes);
            })
          }
          className="neu rounded-full px-4 py-2 text-[13px] font-medium text-foreground disabled:opacity-60"
        >
          Recusar
        </button>
      </div>
    </div>
  );
}
