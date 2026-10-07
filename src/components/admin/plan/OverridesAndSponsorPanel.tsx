"use client";

import { useState } from "react";
import { adminRemoveOverride, adminSaveSponsorConfig, adminSetOverride } from "@/lib/actions/admin-plans";
import { FEATURE_DEFINITIONS, FEATURE_GROUPS, type FeatureKey, type FeatureValue } from "@/lib/plans/features";
import { SPONSOR_TOGGLES } from "@/lib/plans/sponsor";
import { formatFeatureValue } from "@/lib/plans/resolve";
import { Field, buttonClass, ghostButtonClass, inputClass, useSaver } from "@/components/dashboard/landing/ui";

export type OverrideRow = { id: string; featureKey: string; value: FeatureValue; reason: string | null; startsAt: string | null; expiresAt: string | null };

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");
const toDate = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - 3 * 3600 * 1000).toISOString().slice(0, 10) : "");

/** Recursos liberados ou bloqueados manualmente só para esta empresa (sem criar plano novo), com início, fim e motivo. */
export function OverridesPanel({ businessId, overrides }: { businessId: string; overrides: OverrideRow[] }) {
  const { pending, message, run } = useSaver();
  const [feature, setFeature] = useState<FeatureKey>("tour_3d");
  const [value, setValue] = useState<string>("true");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [reason, setReason] = useState("");
  const def = FEATURE_DEFINITIONS.find((item) => item.key === feature)!;

  function parsed(): FeatureValue {
    if (def.kind === "flag") return value === "true";
    if (def.kind === "limit") return value === "unlimited" ? "unlimited" : Number(value);
    return value;
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-6">
      <h2 className="text-[17px] font-semibold">Recursos personalizados</h2>
      <p className="mt-1 text-[14px] text-muted">Liberar ou bloquear um recurso só para esta empresa, por tempo determinado ou sem prazo. O que está aqui vale por cima do plano.</p>

      {overrides.length > 0 && (
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
          {overrides.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-[14px]">
              <span>
                <strong>{FEATURE_DEFINITIONS.find((d) => d.key === item.featureKey)?.label ?? item.featureKey}</strong>
                <span className="text-muted"> — {formatFeatureValue(item.featureKey as FeatureKey, item.value)} · {fmt(item.startsAt)} → {fmt(item.expiresAt)}{item.reason ? ` · ${item.reason}` : ""}</span>
              </span>
              <button type="button" disabled={pending} onClick={() => run(() => adminRemoveOverride(businessId, item.featureKey), "Removido.")} className="tap text-[13.5px] font-semibold text-red-700 hover:underline">
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <Field label="Recurso">
            <select
              value={feature}
              onChange={(e) => {
                const next = e.target.value as FeatureKey;
                setFeature(next);
                const nextDef = FEATURE_DEFINITIONS.find((item) => item.key === next)!;
                setValue(nextDef.kind === "flag" ? "true" : nextDef.kind === "limit" ? "5" : (nextDef.options?.[1] ?? ""));
              }}
              className={inputClass}
            >
              {(Object.keys(FEATURE_GROUPS) as (keyof typeof FEATURE_GROUPS)[]).map((group) => (
                <optgroup key={group} label={FEATURE_GROUPS[group]}>
                  {FEATURE_DEFINITIONS.filter((item) => item.group === group).map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Valor">
          {def.kind === "flag" ? (
            <select value={value} onChange={(e) => setValue(e.target.value)} className={inputClass}>
              <option value="true">Ligado</option>
              <option value="false">Desligado</option>
            </select>
          ) : def.kind === "enum" ? (
            <select value={value} onChange={(e) => setValue(e.target.value)} className={inputClass}>
              {(def.options ?? []).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input value={value} onChange={(e) => setValue(e.target.value)} className={inputClass} placeholder="número ou unlimited" />
          )}
        </Field>
        <Field label="Motivo">
          <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} className={inputClass} />
        </Field>
        <Field label="Início (opcional)">
          <input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Fim (opcional)">
          <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={inputClass} />
        </Field>
        <div className="flex items-end">
          <button type="button" disabled={pending} onClick={() => run(() => adminSetOverride(businessId, { featureKey: feature, value: parsed(), startsAt: startsAt || null, expiresAt: expiresAt || null, reason }), "Recurso salvo.")} className={buttonClass}>
            Aplicar
          </button>
        </div>
      </div>
      {message && <p role="status" className={`mt-3 text-[14px] font-medium ${message.ok ? "text-whatsapp" : "text-red-700"}`}>{message.text}</p>}
    </section>
  );
}

/** Configuração do plano Patrocinador: base = Experiência; benefícios extras, inserções e janela de veiculação ativados na proposta. */
export function SponsorPanel({ businessId, overrides }: { businessId: string; overrides: OverrideRow[] }) {
  const { pending, message, run } = useSaver();
  const active = new Set(overrides.filter((o) => o.value === true).map((o) => o.featureKey));
  const insertions = overrides.find((o) => o.featureKey === "insertions_count");
  const window = overrides.find((o) => SPONSOR_TOGGLES.includes(o.featureKey as FeatureKey) || o.featureKey === "insertions_count");
  const [enabled, setEnabled] = useState<string[]>(SPONSOR_TOGGLES.filter((key) => active.has(key)));
  const [count, setCount] = useState(typeof insertions?.value === "number" ? String(insertions.value) : "0");
  const [startsAt, setStartsAt] = useState(toDate(window?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(toDate(window?.expiresAt ?? null));
  const [reason, setReason] = useState("");

  const toggle = (key: string) => setEnabled((list) => (list.includes(key) ? list.filter((item) => item !== key) : [...list, key]));

  return (
    <section className="rounded-2xl border border-primary/30 bg-primary/[0.03] p-6">
      <h2 className="text-[17px] font-semibold">Configuração do Patrocinador</h2>
      <p className="mt-1 text-[14px] text-muted">
        Base: todos os recursos do plano Experiência + patrocínio (proposta, espaços exclusivos, ativações, presença institucional, métricas de campanha). Ative abaixo o que foi negociado.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {SPONSOR_TOGGLES.map((key) => (
          <label key={key} className="flex items-center gap-2.5 text-[14px]">
            <input type="checkbox" checked={enabled.includes(key)} onChange={() => toggle(key)} className="h-4 w-4 accent-[var(--primary)]" />
            {FEATURE_DEFINITIONS.find((item) => item.key === key)?.label ?? key}
          </label>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Field label="Nº de inserções contratadas">
          <input type="number" min={0} value={count} onChange={(e) => setCount(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Início da veiculação">
          <input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Término da veiculação">
          <input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputClass} />
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Observação da proposta">
          <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} className={inputClass} />
        </Field>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" disabled={pending} onClick={() => run(() => adminSaveSponsorConfig(businessId, { enabled, insertions: Number(count) || 0, startsAt: startsAt || null, endsAt: endsAt || null, reason }), "Patrocínio configurado.")} className={buttonClass}>
          Salvar configuração
        </button>
        <button type="button" disabled={pending} onClick={() => { setEnabled([]); setCount("0"); }} className={ghostButtonClass}>
          Limpar seleção
        </button>
        {message && <p role="status" className={`text-[14px] font-medium ${message.ok ? "text-whatsapp" : "text-red-700"}`}>{message.text}</p>}
      </div>
    </section>
  );
}
