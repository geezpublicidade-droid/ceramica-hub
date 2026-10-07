"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminChangePlan, adminPreviewPlanChange, type ChangePlanFormInput } from "@/lib/actions/admin-plans";
import { featureDefinition, type FeatureKey, type FeatureValue } from "@/lib/plans/features";
import { PLAN_STATUSES, PLAN_STATUS_LABELS, formatFeatureValue, type BillingCycle, type FeatureDiff, type PlanStatus } from "@/lib/plans/resolve";
import { Field, buttonClass, ghostButtonClass, inputClass } from "@/components/dashboard/landing/ui";

type PlanOption = { key: string; name: string };

type Props = {
  businessId: string;
  businessName: string;
  plans: PlanOption[];
  current: {
    plan: string;
    planName: string;
    status: PlanStatus;
    startedAt: string | null;
    expiresAt: string | null;
    billingCycle: BillingCycle;
    manualOverride: boolean;
    discountPercent: number | null;
  };
  adminName: string;
};

type Preview = { diff: FeatureDiff; fromPlanName: string; toPlanName: string; excessContent: { key: string; label: string; used: number; newLimit: number }[] };

const CYCLES: { value: BillingCycle; label: string }[] = [
  { value: "free", label: "Gratuito" },
  { value: "monthly", label: "Mensal" },
  { value: "yearly", label: "Anual" },
  { value: "courtesy", label: "Cortesia" },
  { value: "custom", label: "Negociado / personalizado" },
];

const toDateInput = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - 3 * 3600 * 1000).toISOString().slice(0, 10) : "");

function ChangeList({ title, tone, items }: { title: string; tone: "good" | "bad" | "neutral"; items: { key: FeatureKey; from: FeatureValue; to: FeatureValue }[] }) {
  if (items.length === 0) return null;
  const color = tone === "good" ? "text-whatsapp" : tone === "bad" ? "text-red-700" : "text-foreground";
  return (
    <div>
      <p className={`text-[13px] font-semibold uppercase tracking-wide ${color}`}>{title}</p>
      <ul className="mt-1 space-y-0.5 text-[14px]">
        {items.map((item) => (
          <li key={item.key}>
            {featureDefinition(item.key)?.label ?? item.key}
            {(featureDefinition(item.key)?.kind !== "flag") && (
              <span className="text-muted"> — {formatFeatureValue(item.key, item.from)} → {formatFeatureValue(item.key, item.to)}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Troca de plano com confirmação: mostra plano atual, novo plano, recursos liberados/bloqueados, conteúdo que passa do limite, data e responsável. */
export function ChangePlanPanel({ businessId, businessName, plans, current, adminName }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    plan: current.plan,
    status: current.status,
    startedAt: toDateInput(current.startedAt),
    expiresAt: toDateInput(current.expiresAt),
    billingCycle: current.billingCycle,
    manualOverride: current.manualOverride,
    discountPercent: current.discountPercent?.toString() ?? "",
    reason: "",
  });
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setPreview(null);
    setForm((value0) => ({ ...value0, [key]: value }));
  };

  const payload = (): ChangePlanFormInput => ({
    plan: form.plan,
    status: form.status,
    startedAt: form.startedAt || null,
    expiresAt: form.expiresAt || null,
    billingCycle: form.billingCycle,
    manualOverride: form.manualOverride,
    discountPercent: form.discountPercent === "" ? null : Number(form.discountPercent),
    reason: form.reason,
  });

  function review() {
    setMessage(null);
    startTransition(async () => {
      const result = await adminPreviewPlanChange(businessId, form.plan);
      if (!result.success) return setMessage({ ok: false, text: result.error });
      setPreview({ diff: result.diff, fromPlanName: result.fromPlanName, toPlanName: result.toPlanName, excessContent: result.excessContent });
    });
  }

  function confirm() {
    startTransition(async () => {
      const result = await adminChangePlan(businessId, payload());
      if (!result.success) return setMessage({ ok: false, text: result.error });
      setPreview(null);
      setMessage({ ok: true, text: "Plano atualizado. A página pública, o painel e o posicionamento já refletem a mudança." });
      router.refresh();
    });
  }

  const samePlan = form.plan === current.plan;
  const when = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  return (
    <section className="rounded-2xl border border-border bg-white p-6">
      <h2 className="text-[17px] font-semibold">Alterar plano</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Plano">
          <select value={form.plan} onChange={(e) => set("plan", e.target.value)} className={inputClass}>
            {plans.map((plan) => (
              <option key={plan.key} value={plan.key}>
                {plan.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={(e) => set("status", e.target.value as PlanStatus)} className={inputClass}>
            {PLAN_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PLAN_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ciclo de cobrança">
          <select value={form.billingCycle} onChange={(e) => set("billingCycle", e.target.value as BillingCycle)} className={inputClass}>
            {CYCLES.map((cycle) => (
              <option key={cycle.value} value={cycle.value}>
                {cycle.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Início">
          <input type="date" value={form.startedAt} onChange={(e) => set("startedAt", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Vencimento" hint="Vazio = sem vencimento.">
          <input type="date" value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Desconto negociado (%)">
          <input type="number" min={0} max={100} step="0.5" value={form.discountPercent} onChange={(e) => set("discountPercent", e.target.value)} className={inputClass} />
        </Field>
      </div>
      <label className="mt-4 flex items-start gap-2.5 text-[14px]">
        <input type="checkbox" checked={form.manualOverride} onChange={(e) => set("manualOverride", e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--primary)]" />
        <span>
          <strong>Cortesia / negociação manual</strong> — o plano não vence nem cai por inadimplência (a suspensão continua valendo).
        </span>
      </label>
      <div className="mt-4">
        <Field label="Motivo / observação da alteração">
          <input value={form.reason} onChange={(e) => set("reason", e.target.value)} maxLength={500} className={inputClass} />
        </Field>
      </div>

      {!preview && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" disabled={pending} onClick={review} className={buttonClass}>
            {pending ? "Calculando…" : samePlan ? "Revisar e salvar" : "Revisar mudança"}
          </button>
          {message && <p role="status" className={`text-[14px] font-medium ${message.ok ? "text-whatsapp" : "text-red-700"}`}>{message.text}</p>}
        </div>
      )}

      {preview && (
        <div className="mt-5 space-y-4 rounded-xl border-2 border-primary/30 bg-primary/[0.03] p-5" role="region" aria-label="Confirmação da alteração de plano">
          <p className="text-[15px] font-semibold">Confirmar alteração para {businessName}</p>
          <dl className="grid gap-x-8 gap-y-1 text-[14px] sm:grid-cols-2">
            <div><dt className="inline text-muted">Plano atual: </dt><dd className="inline font-medium">{preview.fromPlanName}</dd></div>
            <div><dt className="inline text-muted">Novo plano: </dt><dd className="inline font-medium">{preview.toPlanName}</dd></div>
            <div><dt className="inline text-muted">Data da alteração: </dt><dd className="inline font-medium">{when}</dd></div>
            <div><dt className="inline text-muted">Responsável: </dt><dd className="inline font-medium">{adminName}</dd></div>
          </dl>
          <ChangeList title="Recursos que serão liberados" tone="good" items={preview.diff.gained} />
          <ChangeList title="Recursos que serão bloqueados" tone="bad" items={preview.diff.lost} />
          <ChangeList title="Outras alterações" tone="neutral" items={preview.diff.changed} />
          {preview.diff.gained.length + preview.diff.lost.length + preview.diff.changed.length === 0 && <p className="text-[14px] text-muted">Os recursos não mudam (só status, datas, ciclo ou desconto).</p>}
          {preview.excessContent.length > 0 && (
            <div className="rounded-lg bg-amber-50 p-3 text-[14px] text-amber-900">
              <p className="font-semibold">Conteúdo acima do novo limite — nada será apagado:</p>
              <ul className="mt-1 list-disc pl-5">
                {preview.excessContent.map((row) => (
                  <li key={row.key}>
                    {row.label}: {row.used} salvos, o plano publica {Number.isFinite(row.newLimit) ? row.newLimit : "todos"}. A empresa escolhe o que fica no ar.
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" disabled={pending} onClick={confirm} className={buttonClass}>
              {pending ? "Aplicando…" : "Confirmar alteração"}
            </button>
            <button type="button" disabled={pending} onClick={() => setPreview(null)} className={ghostButtonClass}>
              Voltar
            </button>
            {message && <p role="alert" className={`text-[14px] font-medium ${message.ok ? "text-whatsapp" : "text-red-700"}`}>{message.text}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
