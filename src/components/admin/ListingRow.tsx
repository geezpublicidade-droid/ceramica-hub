"use client";

import { useTransition } from "react";
import { updateListingStatus, deleteListing } from "@/lib/actions/admin-real-estate";
import type { RealEstateListing } from "@/lib/services/real-estate";

const STATUS_LABEL: Record<RealEstateListing["status"], string> = {
  draft: "Rascunho",
  active: "Ativo (visível no site)",
  inactive: "Inativo",
};
const STATUSES = Object.keys(STATUS_LABEL) as RealEstateListing["status"][];

export function ListingRow({ listing }: { listing: RealEstateListing }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-white/70 p-6">
      <div>
        <p className="text-[16px] font-semibold text-foreground">{listing.title}</p>
        <p className="text-[13px] text-muted">
          {listing.listingType === "venda" ? "Venda" : "Locação"} · {listing.spaceType === "laje_inteira" ? "Laje inteira" : "Sala comercial"}
          {listing.areaM2 && ` · ${listing.areaM2}m²`}
          {listing.towerName && ` · ${listing.towerName}`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <select
          className="rounded-xl border border-border bg-white px-3 py-2 text-[13px] text-foreground disabled:opacity-60"
          value={listing.status}
          disabled={isPending}
          onChange={(e) => startTransition(() => void updateListingStatus(listing.id, e.target.value as RealEstateListing["status"]))}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => void deleteListing(listing.id))}
          className="rounded-full border border-red-200 px-4 py-2 text-[13px] font-medium text-red-600 disabled:opacity-60"
        >
          Excluir
        </button>
      </div>
    </div>
  );
}
