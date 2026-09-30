"use client";

import { useState } from "react";
import { useAdminAction } from "@/components/admin/useAdminAction";
import { runAutomationNow, setAutomationEnabled } from "@/lib/actions/admin-automations";
import type { AutomationKey, AutomationMeta } from "@/lib/services/automations/registry";
import type { AutomationStats } from "@/lib/services/automations/engine";

type AutomationRowProps = {
  automationKey: AutomationKey;
  meta: AutomationMeta;
  enabled: boolean;
  stats: AutomationStats;
};

export function AutomationRow({ automationKey, meta, enabled, stats }: AutomationRowProps) {
  const { error, isPending, run } = useAdminAction();
  const [lastRun, setLastRun] = useState<string | null>(null);

  function handleRunNow() {
    setLastRun(null);
    run(async () => {
      const result = await runAutomationNow(automationKey);
      if (result.success) setLastRun(`${result.result.sent} enviado(s), ${result.result.failed} falha(s), ${result.result.skipped} ignorado(s).`);
      return result.success ? { success: true } : result;
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-white/70 p-6">
      <div className="min-w-0 max-w-xl">
        <p className="text-[16px] font-semibold text-foreground">
          {meta.label}
          <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            {meta.audience === "admin" ? "equipe" : meta.requiresConsent ? "empresas · com consentimento" : "empresas"}
          </span>
        </p>
        <p className="mt-1 text-[14px] text-muted">{meta.description}</p>
        <p className="mt-2 text-[12px] text-muted">
          Últimos 30 dias: {stats.sent} enviado(s), {stats.failed} falha(s)
          {stats.lastSentAt && ` · último envio em ${new Date(stats.lastSentAt).toLocaleDateString("pt-BR")}`}
        </p>
        {lastRun && <p className="mt-1 text-[12px] text-foreground">{lastRun}</p>}
        {error && <p className="mt-1 text-[12px] text-red-700">{error}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" disabled={isPending} onClick={handleRunNow} className="neu rounded-full px-4 py-2 text-[13px] font-medium text-foreground disabled:opacity-60">
          {isPending ? "Executando..." : "Executar agora"}
        </button>
        <label className="flex items-center gap-2 text-[13px] text-foreground">
          <input type="checkbox" checked={enabled} disabled={isPending} onChange={(e) => run(() => setAutomationEnabled(automationKey, e.target.checked))} />
          {enabled ? "Ligada" : "Desligada"}
        </label>
      </div>
    </div>
  );
}
