"use client";

import { useState } from "react";
import { useAdminAction } from "@/components/admin/useAdminAction";
import { saveGoal } from "@/lib/actions/admin-goals";
import { GOALS, goalProgress, type GoalMetric } from "@/lib/services/executive-goals";
import { formatCents, parseCentsInput } from "@/lib/utils";

type GoalRowProps = {
  goal: { month: string; metric: GoalMetric; target: number | null; actual: number };
  canEdit: boolean;
};

function formatValue(metric: GoalMetric, value: number): string {
  const { unit } = GOALS[metric];
  if (unit === "money") return formatCents(value);
  return unit === "percent" ? `${value}%` : String(value);
}

/** Converte o texto digitado pro valor guardado: R$ vira centavos, o resto é número puro. */
function parseTarget(metric: GoalMetric, text: string): number | null {
  if (!text.trim()) return null;
  if (GOALS[metric].unit === "money") return parseCentsInput(text);
  const n = Number(text.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function initialText(metric: GoalMetric, target: number | null): string {
  if (target === null) return "";
  return GOALS[metric].unit === "money" ? String(target / 100) : String(target);
}

export function GoalRow({ goal, canEdit }: GoalRowProps) {
  const { month, metric, target, actual } = goal;
  const { error, isPending, run } = useAdminAction();
  const [text, setText] = useState(initialText(metric, target));
  const progress = target === null ? null : goalProgress(actual, target);

  return (
    <div className="rounded-2xl border border-border bg-white/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px] font-medium text-foreground">{GOALS[metric].label}</p>
        <p className="text-[14px] text-muted">
          Atual <strong className="text-foreground">{formatValue(metric, actual)}</strong>
          {target !== null && <> de {formatValue(metric, target)}</>}
        </p>
      </div>
      {progress !== null && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10" role="progressbar" aria-valuenow={Math.min(progress, 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className={`h-full rounded-full ${progress >= 100 ? "bg-green-600" : "bg-primary"}`} style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      )}
      {canEdit && (
        <form
          className="mt-3 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const parsed = parseTarget(metric, text);
            if (text.trim() && parsed === null) return;
            run(() => saveGoal(month, metric, parsed));
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            inputMode="decimal"
            placeholder={GOALS[metric].unit === "money" ? "Meta em R$" : "Meta"}
            className="w-36 rounded-xl border border-border bg-white px-3 py-2 text-base text-foreground outline-none focus:border-primary lg:text-[14px]"
          />
          <button type="submit" disabled={isPending} className="neu rounded-full px-4 py-2 text-[13px] font-medium text-foreground disabled:opacity-60">
            {isPending ? "Salvando..." : "Salvar meta"}
          </button>
        </form>
      )}
      {error && <p className="mt-2 text-[12px] text-red-700">{error}</p>}
    </div>
  );
}
