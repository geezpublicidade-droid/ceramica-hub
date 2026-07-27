"use client";

import { useTransition } from "react";
import { updateMeetingSpaceStatus, deleteMeetingSpace } from "@/lib/actions/admin-meeting-spaces";
import type { MeetingSpace } from "@/lib/services/meeting-spaces";

const STATUS_LABEL: Record<MeetingSpace["status"], string> = {
  draft: "Rascunho",
  active: "Ativo (visível no site)",
  inactive: "Inativo",
};
const STATUSES = Object.keys(STATUS_LABEL) as MeetingSpace["status"][];

export function MeetingSpaceRow({ space }: { space: MeetingSpace }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-white/70 p-6">
      <div>
        <p className="text-[16px] font-semibold text-foreground">{space.name}</p>
        <p className="text-[13px] text-muted">
          {space.spaceType === "auditorio" ? "Auditório" : "Sala de reunião"}
          {space.capacity && ` · até ${space.capacity} pessoas`}
          {space.towerName && ` · ${space.towerName}`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <select
          className="rounded-xl border border-border bg-white px-3 py-2 text-[13px] text-foreground disabled:opacity-60"
          value={space.status}
          disabled={isPending}
          onChange={(e) => startTransition(() => void updateMeetingSpaceStatus(space.id, e.target.value as MeetingSpace["status"]))}
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
          onClick={() => startTransition(() => void deleteMeetingSpace(space.id))}
          className="rounded-full border border-red-200 px-4 py-2 text-[13px] font-medium text-red-600 disabled:opacity-60"
        >
          Excluir
        </button>
      </div>
    </div>
  );
}
