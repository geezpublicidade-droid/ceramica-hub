"use client";

import { useState } from "react";
import {
  adminEndTrial,
  adminGrantCourtesy,
  adminRenewPlan,
  adminSaveDiscount,
  adminSaveNote,
  adminSetOwnerValidated,
  adminSetPlanStatus,
  adminStartTrial,
} from "@/lib/actions/admin-plans";
import type { PlanStatus } from "@/lib/plans/resolve";
import { Field, buttonClass, ghostButtonClass, inputClass, useSaver } from "@/components/dashboard/landing/ui";

type Props = {
  businessId: string;
  plans: { key: string; name: string }[];
  status: PlanStatus;
  discountPercent: number | null;
  notes: string | null;
  ownerValidated: boolean;
  trialActive: boolean;
};

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-4 first:border-0 first:pt-0">
      <h3 className="text-[14px] font-semibold">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}

/** Suspender, reativar, cancelar, renovar, teste, cortesia, desconto, observação interna e perfil sem proprietário. */
export function QuickActionsPanel({ businessId, plans, status, discountPercent, notes, ownerValidated, trialActive }: Props) {
  const { pending, message, run } = useSaver();
  const [renewDays, setRenewDays] = useState("30");
  const [reason, setReason] = useState("");
  const [courtesy, setCourtesy] = useState({ plan: plans.find((p) => p.key !== "presenca")?.key ?? plans[0]?.key ?? "", until: "", reason: "" });
  const [trial, setTrial] = useState({ plan: plans.find((p) => p.key === "destaque")?.key ?? plans[0]?.key ?? "", days: "14" });
  const [discount, setDiscount] = useState(discountPercent?.toString() ?? "");
  const [note, setNote] = useState(notes ?? "");

  return (
    <section className="rounded-2xl border border-border bg-white p-6">
      <h2 className="text-[17px] font-semibold">Ações rápidas</h2>
      <div className="mt-4 space-y-5">
        <Row title="Status do plano">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-56 flex-1">
              <Field label="Motivo (opcional)">
                <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} className={inputClass} />
              </Field>
            </div>
            {status === "suspended" || status === "canceled" || status === "expired" || status === "past_due" || status === "pending" ? (
              <button type="button" disabled={pending} onClick={() => run(() => adminSetPlanStatus(businessId, "active", reason), "Plano reativado.")} className={buttonClass}>
                Reativar plano
              </button>
            ) : (
              <>
                <button type="button" disabled={pending} onClick={() => run(() => adminSetPlanStatus(businessId, "suspended", reason), "Plano suspenso.")} className={ghostButtonClass}>
                  Suspender
                </button>
                <button type="button" disabled={pending} onClick={() => run(() => adminSetPlanStatus(businessId, "canceled", reason), "Plano cancelado (vale até o vencimento).")} className={ghostButtonClass}>
                  Cancelar
                </button>
              </>
            )}
          </div>
        </Row>

        <Row title="Renovar">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-32">
              <Field label="Dias">
                <input type="number" min={1} max={800} value={renewDays} onChange={(e) => setRenewDays(e.target.value)} className={inputClass} />
              </Field>
            </div>
            <button type="button" disabled={pending} onClick={() => run(() => adminRenewPlan(businessId, Number(renewDays), reason), "Plano renovado.")} className={buttonClass}>
              Renovar e reativar
            </button>
            <p className="pb-2 text-[13px] text-muted">Soma ao vencimento atual (ou a partir de hoje, se já venceu).</p>
          </div>
        </Row>

        <Row title="Período de teste">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-44">
              <Field label="Plano do teste">
                <select value={trial.plan} onChange={(e) => setTrial({ ...trial, plan: e.target.value })} className={inputClass}>
                  {plans.map((p) => (
                    <option key={p.key} value={p.key}>{p.name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="w-28">
              <Field label="Dias">
                <input type="number" min={1} max={90} value={trial.days} onChange={(e) => setTrial({ ...trial, days: e.target.value })} className={inputClass} />
              </Field>
            </div>
            <button type="button" disabled={pending} onClick={() => run(() => adminStartTrial(businessId, trial.plan, Number(trial.days)), "Teste iniciado.")} className={buttonClass}>
              Iniciar teste
            </button>
            {trialActive && (
              <button type="button" disabled={pending} onClick={() => run(() => adminEndTrial(businessId), "Teste encerrado.")} className={ghostButtonClass}>
                Encerrar teste em andamento
              </button>
            )}
          </div>
        </Row>

        <Row title="Conceder cortesia">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-44">
              <Field label="Plano">
                <select value={courtesy.plan} onChange={(e) => setCourtesy({ ...courtesy, plan: e.target.value })} className={inputClass}>
                  {plans.map((p) => (
                    <option key={p.key} value={p.key}>{p.name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="w-44">
              <Field label="Até (opcional)" hint="Vazio = sem prazo">
                <input type="date" value={courtesy.until} onChange={(e) => setCourtesy({ ...courtesy, until: e.target.value })} className={inputClass} />
              </Field>
            </div>
            <div className="min-w-56 flex-1">
              <Field label="Motivo (obrigatório)">
                <input value={courtesy.reason} onChange={(e) => setCourtesy({ ...courtesy, reason: e.target.value })} maxLength={500} className={inputClass} />
              </Field>
            </div>
            <button type="button" disabled={pending} onClick={() => run(() => adminGrantCourtesy(businessId, courtesy.plan, courtesy.until || null, courtesy.reason), "Cortesia concedida.")} className={buttonClass}>
              Conceder
            </button>
          </div>
        </Row>

        <Row title="Desconto negociado">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-32">
              <Field label="%">
                <input type="number" min={0} max={100} step="0.5" value={discount} onChange={(e) => setDiscount(e.target.value)} className={inputClass} />
              </Field>
            </div>
            <button type="button" disabled={pending} onClick={() => run(() => adminSaveDiscount(businessId, discount === "" ? null : Number(discount)), "Desconto salvo.")} className={buttonClass}>
              Salvar desconto
            </button>
            <p className="pb-2 text-[13px] text-muted">Aplicado automaticamente nas próximas faturas da empresa.</p>
          </div>
        </Row>

        <Row title="Observação interna">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={2000} className={inputClass} placeholder="Visível só para a equipe." />
          <button type="button" disabled={pending} onClick={() => run(() => adminSaveNote(businessId, note), "Observação salva.")} className={`${buttonClass} mt-2`}>
            Salvar observação
          </button>
        </Row>

        <Row title="Proprietário do perfil">
          <label className="flex items-start gap-2.5 text-[14px]">
            <input
              type="checkbox"
              checked={ownerValidated}
              disabled={pending}
              onChange={(e) => run(() => adminSetOwnerValidated(businessId, e.target.checked), e.target.checked ? "Proprietário validado." : "Perfil marcado como sem proprietário.")}
              className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
            />
            <span>Proprietário validado. Desmarcado, a página pública convida a “reivindicar este perfil”.</span>
          </label>
        </Row>
      </div>
      {message && (
        <p role="status" className={`mt-4 text-[14px] font-medium ${message.ok ? "text-whatsapp" : "text-red-700"}`}>
          {message.text}
        </p>
      )}
    </section>
  );
}
