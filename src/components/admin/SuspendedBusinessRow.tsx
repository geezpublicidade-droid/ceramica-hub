"use client";

import { useTransition } from "react";
import { reactivateBusiness } from "@/lib/actions/admin-business";

type SuspendedBusiness = {
  id: string;
  name: string;
  towerName: string | null;
  floor: string;
  roomNumber: string;
  rejectionReason: string | null;
};

export function SuspendedBusinessRow({ business }: { business: SuspendedBusiness }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50/60 px-4 py-3">
      <div>
        <p className="text-[15px] text-muted">
          {business.name} — {business.towerName ?? "torre não informada"} · {business.floor} · sala{" "}
          {business.roomNumber}
        </p>
        {business.rejectionReason && (
          <p className="mt-1 text-[13px] text-muted">Motivo: {business.rejectionReason}</p>
        )}
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => reactivateBusiness(business.id))}
        className="neu-primary rounded-full px-4 py-2 text-[13px] font-medium text-white disabled:opacity-60"
      >
        Reativar
      </button>
    </div>
  );
}
