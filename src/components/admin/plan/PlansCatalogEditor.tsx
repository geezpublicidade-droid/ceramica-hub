"use client";

import { useState } from "react";
import { adminCreatePlan, adminSaveGraceDays, adminSavePlanFeatures, adminUpdatePlan } from "@/lib/actions/admin-plans";
import { FEATURE_DEFINITIONS, FEATURE_GROUPS, UNLIMITED, type FeatureKey, type FeatureMap, type FeatureValue, type PlanDefinition } from "@/lib/plans/features";
import { Field, buttonClass, ghostButtonClass, inputClass, useSaver } from "@/components/dashboard/landing/ui";

type Props = {
  plans: PlanDefinition[];
  features: Record<string, FeatureMap>;
  graceDays: number;
  prices: Record<string, { monthlyCents: number | null }>;
  companyCounts: Record<string, number>;
};

function ValueInput({ def, value, onChange }: { def: (typeof FEATURE_DEFINITIONS)[number]; value: FeatureValue; onChange: (value: FeatureValue) => void }) {
  if (def.kind === "flag") {
    return (
      <select value={String(value === true)} onChange={(e) => onChange(e.target.value === "true")} className={`${inputClass} !mt-0 !w-28 !py-1.5`}>
        <option value="true">Sim</option>
        <option value="false">Não</option>
      </select>
    );
  }
  if (def.kind === "enum") {
    return (
      <select value={String(value)} onChange={(e) => onChange(e.target.value)} className={`${inputClass} !mt-0 !w-40 !py-1.5`}>
        {(def.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }
  const unlimited = value === UNLIMITED;
  return (
    <span className="flex items-center gap-3">
      <input type="number" min={0} disabled={unlimited} value={unlimited ? "" : String(value)} onChange={(e) => onChange(Number(e.target.value))} className={`${inputClass} !mt-0 !w-28 !py-1.5`} />
      <label className="flex items-center gap-1.5 text-[13px]">
        <input type="checkbox" checked={unlimited} onChange={(e) => onChange(e.target.checked ? UNLIMITED : 0)} className="h-4 w-4 accent-[var(--primary)]" />
        ilimitado
      </label>
    </span>
  );
}

/** Catálogo de planos: recursos e limites de cada plano, criação de planos novos e tolerância de inadimplência. Tudo vale na hora para as empresas do plano. */
export function PlansCatalogEditor({ plans, features, graceDays, prices, companyCounts }: Props) {
  const [selected, setSelected] = useState(plans[0]?.key ?? "presenca");
  const [draft, setDraft] = useState<Record<string, FeatureMap>>(features);
  const [meta, setMeta] = useState<Record<string, { name: string; description: string; rank: string; active: boolean; isPublic: boolean }>>(
    Object.fromEntries(plans.map((plan) => [plan.key, { name: plan.name, description: plan.description, rank: String(plan.rank), active: plan.active, isPublic: plan.isPublic }])),
  );
  const [grace, setGrace] = useState(String(graceDays));
  const [created, setCreated] = useState({ key: "", name: "", description: "", rank: "6", copyFrom: "experiencia", price: "" });
  const { pending, message, run } = useSaver();

  const plan = plans.find((item) => item.key === selected)!;
  const current = draft[selected];
  const setValue = (key: FeatureKey, value: FeatureValue) => setDraft((all) => ({ ...all, [selected]: { ...all[selected], [key]: value } }));

  return (
    <div className="space-y-6">
      {message && <p role="status" className={`rounded-lg px-4 py-2.5 text-[14px] font-medium ${message.ok ? "bg-whatsapp/10 text-whatsapp" : "bg-red-50 text-red-800"}`}>{message.text}</p>}

      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="text-[17px] font-semibold">Planos</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="py-2 font-medium">Plano</th>
                <th className="py-2 font-medium">Ordem</th>
                <th className="py-2 font-medium">Preço/mês</th>
                <th className="py-2 font-medium">Empresas</th>
                <th className="py-2 font-medium">Ativo</th>
                <th className="py-2 font-medium">Público</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {plans.map((item) => {
                const m = meta[item.key];
                const cents = prices[item.key]?.monthlyCents;
                return (
                  <tr key={item.key} className="border-b border-border/60">
                    <td className="py-2 pr-3">
                      <input value={m.name} onChange={(e) => setMeta({ ...meta, [item.key]: { ...m, name: e.target.value } })} className={`${inputClass} !mt-0 !py-1.5`} aria-label={`Nome de ${item.key}`} />
                      <span className="text-[12px] text-muted">{item.key}{item.isSystem ? " · plano de fábrica" : ""}</span>
                    </td>
                    <td className="py-2 pr-3"><input type="number" value={m.rank} onChange={(e) => setMeta({ ...meta, [item.key]: { ...m, rank: e.target.value } })} className={`${inputClass} !mt-0 !w-20 !py-1.5`} /></td>
                    <td className="py-2 pr-3">{cents ? `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</td>
                    <td className="py-2 pr-3">{companyCounts[item.key] ?? 0}</td>
                    <td className="py-2 pr-3"><input type="checkbox" checked={m.active} onChange={(e) => setMeta({ ...meta, [item.key]: { ...m, active: e.target.checked } })} className="h-4 w-4 accent-[var(--primary)]" /></td>
                    <td className="py-2 pr-3"><input type="checkbox" checked={m.isPublic} onChange={(e) => setMeta({ ...meta, [item.key]: { ...m, isPublic: e.target.checked } })} className="h-4 w-4 accent-[var(--primary)]" /></td>
                    <td className="py-2">
                      <button type="button" disabled={pending} onClick={() => run(() => adminUpdatePlan(item.key, { name: m.name, description: m.description, rank: Number(m.rank), active: m.active, isPublic: m.isPublic }), "Plano atualizado.")} className={ghostButtonClass}>
                        Salvar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[13px] text-muted">Preços são editados no catálogo comercial (/admin/produtos), na linha de cada plano.</p>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-[17px] font-semibold">Recursos e limites</h2>
          <div className="min-w-56">
            <Field label="Plano">
              <select value={selected} onChange={(e) => setSelected(e.target.value)} className={inputClass}>
                {plans.map((item) => (
                  <option key={item.key} value={item.key}>{item.name}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>
        <p className="mt-1 text-[13.5px] text-muted">Alterações valem para todas as empresas do plano “{plan.name}” assim que forem salvas. Limites menores nunca apagam conteúdo: o excedente fica salvo e oculto.</p>
        <div className="mt-4 space-y-6">
          {(Object.keys(FEATURE_GROUPS) as (keyof typeof FEATURE_GROUPS)[]).map((group) => (
            <div key={group}>
              <h3 className="text-[14px] font-semibold">{FEATURE_GROUPS[group]}</h3>
              <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
                {FEATURE_DEFINITIONS.filter((def) => def.group === group).map((def) => (
                  <li key={def.key} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-[14px]">
                    <span>{def.label}<span className="block text-[11.5px] text-muted">{def.key}</span></span>
                    <ValueInput def={def} value={current[def.key]} onChange={(value) => setValue(def.key, value)} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" disabled={pending} onClick={() => run(() => adminSavePlanFeatures(selected, current), "Recursos salvos.")} className={buttonClass}>
            Salvar recursos de {plan.name}
          </button>
          <button type="button" disabled={pending} onClick={() => setDraft((all) => ({ ...all, [selected]: features[selected] }))} className={ghostButtonClass}>
            Descartar alterações
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="text-[17px] font-semibold">Criar novo plano</h2>
        <p className="mt-1 text-[13.5px] text-muted">O novo plano nasce com os recursos de outro (ajuste depois) e já pode ser atribuído a empresas. Se informar preço, ele também entra no catálogo comercial.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Chave (única)" hint="minúsculas, números e _ — ex.: plano_anual">
            <input value={created.key} onChange={(e) => setCreated({ ...created, key: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Nome">
            <input value={created.name} onChange={(e) => setCreated({ ...created, name: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Copiar recursos de">
            <select value={created.copyFrom} onChange={(e) => setCreated({ ...created, copyFrom: e.target.value })} className={inputClass}>
              {plans.map((item) => (
                <option key={item.key} value={item.key}>{item.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Ordem na escada de upgrade">
            <input type="number" value={created.rank} onChange={(e) => setCreated({ ...created, rank: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Preço mensal (R$, opcional)">
            <input type="number" min={0} step="0.01" value={created.price} onChange={(e) => setCreated({ ...created, price: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Descrição">
            <input value={created.description} onChange={(e) => setCreated({ ...created, description: e.target.value })} maxLength={300} className={inputClass} />
          </Field>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => adminCreatePlan({ key: created.key, name: created.name, description: created.description, rank: Number(created.rank), copyFrom: created.copyFrom, monthlyPriceCents: created.price ? Math.round(Number(created.price) * 100) : null }), "Plano criado. Recarregue a página para editar os recursos dele.")}
          className={`${buttonClass} mt-4`}
        >
          Criar plano
        </button>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="text-[17px] font-semibold">Inadimplência e vencimento</h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="w-44">
            <Field label="Dias de tolerância" hint="Depois do vencimento, a página mantém os recursos por este prazo.">
              <input type="number" min={0} max={90} value={grace} onChange={(e) => setGrace(e.target.value)} className={inputClass} />
            </Field>
          </div>
          <button type="button" disabled={pending} onClick={() => run(() => adminSaveGraceDays(Number(grace)), "Tolerância salva.")} className={buttonClass}>
            Salvar
          </button>
        </div>
        <p className="mt-2 text-[13px] text-muted">Passado o prazo, a página volta aos recursos do plano gratuito. Todo o conteúdo pago fica salvo (inativo) e volta ao regularizar o pagamento.</p>
      </section>
    </div>
  );
}
