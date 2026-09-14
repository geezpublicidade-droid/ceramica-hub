"use client";

import { useTransition, type ReactNode } from "react";

export type ToggleableStatus = "draft" | "active" | "inactive";

const STATUS_LABEL: Record<ToggleableStatus, string> = {
  draft: "Rascunho",
  active: "Ativo (visível no site)",
  inactive: "Inativo",
};
const STATUSES = Object.keys(STATUS_LABEL) as ToggleableStatus[];

type StatusToggleRowProps = {
  title: string;
  subtitle: ReactNode;
  status: ToggleableStatus;
  onStatusChange: (status: ToggleableStatus) => unknown;
  onDelete: () => unknown;
};

/** Linha de admin draft/active/inactive + excluir — base de HotelRow, MeetingSpaceRow e EventRow. */
export function StatusToggleRow({ title, subtitle, status, onStatusChange, onDelete }: StatusToggleRowProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-white/70 p-6">
      <div>
        <p className="text-[16px] font-semibold text-foreground">{title}</p>
        <p className="text-[13px] text-muted">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <select
          className="rounded-xl border border-border bg-white px-3 py-2 text-[13px] text-foreground disabled:opacity-60"
          value={status}
          disabled={isPending}
          onChange={(e) => startTransition(() => void onStatusChange(e.target.value as ToggleableStatus))}
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
          onClick={() => startTransition(() => void onDelete())}
          className="rounded-full border border-red-200 px-4 py-2 text-[13px] font-medium text-red-600 disabled:opacity-60"
        >
          Excluir
        </button>
      </div>
    </div>
  );
}
