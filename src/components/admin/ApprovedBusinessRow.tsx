"use client";

import { useTransition } from "react";
import { setBusinessFounder } from "@/lib/actions/admin-business";

type ApprovedBusiness = {
  id: string;
  name: string;
  towerName: string | null;
  floor: string;
  roomNumber: string;
  founder: boolean;
};

export function ApprovedBusinessRow({ business }: { business: ApprovedBusiness }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white/60 px-4 py-3">
      <p className="text-[15px] text-muted">
        {business.name} — {business.towerName ?? "torre não informada"} · {business.floor} · sala{" "}
        {business.roomNumber}
      </p>
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
  );
}
