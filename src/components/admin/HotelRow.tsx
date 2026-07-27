"use client";

import { useTransition } from "react";
import { updateHotelStatus, deleteHotel } from "@/lib/actions/admin-hotels";
import type { Hotel } from "@/lib/services/hotels";

const STATUS_LABEL: Record<Hotel["status"], string> = {
  draft: "Rascunho",
  active: "Ativo (visível no site)",
  inactive: "Inativo",
};
const STATUSES = Object.keys(STATUS_LABEL) as Hotel["status"][];

export function HotelRow({ hotel }: { hotel: Hotel }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-white/70 p-6">
      <div>
        <p className="text-[16px] font-semibold text-foreground">{hotel.name}</p>
        <p className="text-[13px] text-muted">{hotel.address}</p>
      </div>
      <div className="flex items-center gap-2">
        <select
          className="rounded-xl border border-border bg-white px-3 py-2 text-[13px] text-foreground disabled:opacity-60"
          value={hotel.status}
          disabled={isPending}
          onChange={(e) => startTransition(() => void updateHotelStatus(hotel.id, e.target.value as Hotel["status"]))}
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
          onClick={() => startTransition(() => void deleteHotel(hotel.id))}
          className="rounded-full border border-red-200 px-4 py-2 text-[13px] font-medium text-red-600 disabled:opacity-60"
        >
          Excluir
        </button>
      </div>
    </div>
  );
}
