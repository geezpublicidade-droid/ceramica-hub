"use client";

import { useState, useTransition } from "react";
import { approveBusiness, rejectBusiness } from "@/lib/actions/admin-business";

type Business = {
  id: string;
  name: string;
  responsible_name: string | null;
  email: string;
  category: string;
  phone: string;
  document: string | null;
  floor: string;
  room_number: string;
  towers: { name: string } | null;
};

export function AdminBusinessRow({ business }: { business: Business }) {
  const [isPending, startTransition] = useTransition();
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <div className="rounded-2xl border border-border bg-white/70 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-semibold text-foreground">{business.name}</p>
          <p className="text-[13px] text-muted">
            {business.category} · {business.towers?.name ?? "torre não informada"} ·{" "}
            {business.floor} · sala {business.room_number}
          </p>
          <p className="mt-1 text-[13px] text-muted">
            Responsável: {business.responsible_name ?? "não informado"} · {business.email} ·{" "}
            {business.phone}
          </p>
          {business.document && <p className="text-[13px] text-muted">Documento: {business.document}</p>}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => approveBusiness(business.id))}
            className="neu-primary rounded-full px-4 py-2 text-[13px] font-medium text-white disabled:opacity-60"
          >
            Aprovar
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setShowRejectReason((v) => !v)}
            className="neu rounded-full px-4 py-2 text-[13px] font-medium text-foreground disabled:opacity-60"
          >
            Rejeitar
          </button>
        </div>
      </div>

      {showRejectReason && (
        <div className="mt-4 flex gap-2">
          <input
            className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-[13px]"
            placeholder="Motivo da rejeição (opcional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => rejectBusiness(business.id, reason))}
            className="rounded-xl bg-red-600 px-4 py-2 text-[13px] font-medium text-white disabled:opacity-60"
          >
            Confirmar rejeição
          </button>
        </div>
      )}
    </div>
  );
}
