"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchLandingMetrics, type LandingMetricsResult } from "@/lib/actions/landing-editor";
import type { RangePreset } from "@/lib/landing/metrics";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/landing/leads";
import { TabIntro, UpgradeNote, ghostButtonClass, inputClass } from "../ui";
import type { TabProps } from "../types";

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "custom", label: "Personalizado" },
];

function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <p className="text-[12.5px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-[26px] font-semibold tracking-tight">{value}</p>
      {hint && <p className="text-[12px] text-muted">{hint}</p>}
    </div>
  );
}

function RankList({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <p className="text-[14px] font-semibold">{title}</p>
      {rows.length === 0 ? (
        <p className="mt-2 text-[13.5px] text-muted">Sem dados no período.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="flex justify-between text-[13.5px]">
                <span className="truncate pr-3">{row.label}</span>
                <strong>{row.count}</strong>
              </div>
              <div className="mt-1 h-1.5 rounded bg-black/5">
                <div className="h-1.5 rounded bg-primary" style={{ width: `${(row.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DailyBars({ rows }: { rows: { day: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <p className="text-[14px] font-semibold">Visitas por dia</p>
      {rows.length === 0 ? (
        <p className="mt-2 text-[13.5px] text-muted">Sem visitas no período.</p>
      ) : (
        <div className="mt-4 flex h-32 items-end gap-1" role="img" aria-label="Visitas por dia">
          {rows.map((row) => (
            <div key={row.day} className="group relative flex-1" title={`${row.day.split("-").reverse().join("/")}: ${row.count}`}>
              <div className="w-full rounded-t bg-primary/80 transition group-hover:bg-primary" style={{ height: `${Math.max(4, (row.count / max) * 100)}%` }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Métricas da página: visitas, cliques de contato, formulários, serviços mais clicados, origem, dispositivo e conversão. */
export function MetricsTab({ data, target }: TabProps) {
  const [preset, setPreset] = useState<RangePreset>("30d");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [state, setState] = useState<{ key: string; result: LandingMetricsResult } | null>(null);
  const full = data.capabilities.metrics === "full";
  const key = `${preset}|${custom.from}|${custom.to}`;
  const ready = preset !== "custom" || Boolean(custom.from && custom.to);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    fetchLandingMetrics(target, preset, custom)
      .catch(() => ({ success: false as const, error: "Falha ao carregar." }))
      .then((result) => {
        if (!cancelled) setState({ key, result });
      });
    return () => {
      cancelled = true;
    };
    // custom já está resumido em `key`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready, target]);

  const result = state?.result ?? null;
  const loading = ready && state?.key !== key;

  if (data.capabilities.metrics === "none") return <UpgradeNote>As métricas da página fazem parte do plano Profissional ou superior.</UpgradeNote>;

  const metrics = result?.success ? result.metrics : null;
  return (
    <div className="space-y-5">
      <TabIntro>Visitas são contadas uma vez por sessão. Taxa de conversão = ações de contato (WhatsApp, telefone, como chegar e formulário) ÷ visitas × 100.</TabIntro>
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((item) => (
          <button key={item.value} type="button" onClick={() => setPreset(item.value)} className={`${ghostButtonClass} ${preset === item.value ? "!border-primary !bg-primary/10 !text-primary" : ""}`}>
            {item.label}
          </button>
        ))}
        {preset === "custom" && (
          <span className="flex flex-wrap items-center gap-2 text-[14px]">
            <input type="date" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} className={`${inputClass} !mt-0 !w-auto`} aria-label="De" />
            até
            <input type="date" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} className={`${inputClass} !mt-0 !w-auto`} aria-label="Até" />
          </span>
        )}
      </div>

      {result && !result.success && <p className="text-[14px] font-medium text-red-700">{result.error}</p>}
      {loading && !metrics && <p className="text-[14px] text-muted">Carregando…</p>}
      {metrics && (
        <div className={loading ? "opacity-60" : ""}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Visitas" value={metrics.views} />
            <Kpi label="Cliques no WhatsApp" value={metrics.whatsapp} />
            <Kpi label="Cliques no telefone" value={metrics.phone} />
            <Kpi label="Como chegar" value={metrics.directions} />
            <Kpi label="Formulários" value={metrics.leads} />
            <Kpi label="Cupons / ofertas" value={metrics.offerClicks} hint="cliques em “Quero aproveitar”" />
            <Kpi label="Serviços clicados" value={metrics.serviceClicks} />
            <Kpi label="Conversão" value={`${metrics.conversionRate}%`} hint={`${metrics.contactActions} ações de contato`} />
          </div>
          {result?.success && result.truncated && <p className="mt-2 text-[12.5px] text-amber-700">Período muito movimentado: contamos os primeiros 20.000 eventos.</p>}
          {full ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <DailyBars rows={metrics.viewsByDay} />
              <RankList title="Serviços mais clicados" rows={result?.success ? result.topServices.map((s) => ({ label: s.name, count: s.count })) : []} />
              <RankList title="Origem das visitas" rows={metrics.sources.map((s) => ({ label: s.source, count: s.count }))} />
              <RankList title="Dispositivo" rows={metrics.devices.map((d) => ({ label: d.device === "mobile" ? "Celular" : "Computador", count: d.count }))} />
              <RankList title="Categoria de origem" rows={metrics.fromCategories.map((c) => ({ label: c.category, count: c.count }))} />
              <RankList title="Campanha" rows={metrics.campaigns.map((c) => ({ label: c.campaign, count: c.count }))} />
            </div>
          ) : (
            <div className="mt-4">
              <UpgradeNote>Gráficos, origem das visitas, dispositivo e serviços mais clicados fazem parte do plano Destaque ou superior.</UpgradeNote>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[14px] font-semibold">Leads do formulário</p>
          <Link href="/dashboard/leads" className="text-[14px] font-medium text-primary hover:underline">
            Ver e atender leads →
          </Link>
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {LEAD_STATUSES.map((status) => (
            <li key={status} className="text-[13px]">
              <span className="block text-muted">{LEAD_STATUS_LABELS[status]}</span>
              <strong className="text-[18px]">{data.leadCounts[status]}</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
