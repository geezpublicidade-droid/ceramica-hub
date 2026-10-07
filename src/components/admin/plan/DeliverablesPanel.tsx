"use client";

import { useState } from "react";
import { adminAddDeliverable, adminSetDeliverableStatus } from "@/lib/actions/admin-plans";
import { Field, buttonClass, ghostButtonClass, inputClass, useSaver } from "@/components/dashboard/landing/ui";

export type DeliverableRow = { id: string; kind: string; title: string; status: "planned" | "scheduled" | "delivered" | "canceled"; scheduledFor: string | null; deliveredAt: string | null; notes: string | null };

const KINDS: Record<string, string> = {
  tour3d_production: "Produção 3D",
  networking_event: "Encontro empresarial",
  networking_meal: "Café/almoço de networking",
  marketing_action: "Ação de marketing",
  institutional_content: "Conteúdo institucional",
  special_action: "Ação especial do Hub",
};
const STATUS: Record<DeliverableRow["status"], string> = { planned: "Planejada", scheduled: "Agendada", delivered: "Entregue", canceled: "Cancelada" };

/** Entregas do plano (produção 3D por ciclo, networking, conteúdo institucional, ações): o que foi prometido e o que já foi feito. */
export function DeliverablesPanel({ businessId, deliverables }: { businessId: string; deliverables: DeliverableRow[] }) {
  const { pending, message, run } = useSaver();
  const [form, setForm] = useState({ kind: "tour3d_production", title: "", scheduledFor: "", notes: "" });

  return (
    <section className="rounded-2xl border border-border bg-white p-6">
      <h2 className="text-[17px] font-semibold">Entregas do plano</h2>
      {deliverables.length === 0 ? (
        <p className="mt-2 text-[14px] text-muted">Nenhuma entrega registrada.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
          {deliverables.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-[14px]">
              <span>
                <strong>{item.title}</strong>
                <span className="text-muted"> — {KINDS[item.kind] ?? item.kind} · {STATUS[item.status]}{item.scheduledFor ? ` · ${new Date(item.scheduledFor).toLocaleDateString("pt-BR", { timeZone: "UTC" })}` : ""}</span>
              </span>
              <span className="flex gap-2">
                {item.status !== "delivered" && (
                  <button type="button" disabled={pending} onClick={() => run(() => adminSetDeliverableStatus(businessId, item.id, "delivered"), "Marcada como entregue.")} className={ghostButtonClass}>
                    Marcar entregue
                  </button>
                )}
                {item.status !== "canceled" && item.status !== "delivered" && (
                  <button type="button" disabled={pending} onClick={() => run(() => adminSetDeliverableStatus(businessId, item.id, "canceled"), "Cancelada.")} className="tap text-[13.5px] font-semibold text-red-700 hover:underline">
                    Cancelar
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Tipo">
          <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className={inputClass}>
            {Object.entries(KINDS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
        <div className="lg:col-span-2">
          <Field label="Título">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={160} className={inputClass} />
          </Field>
        </div>
        <Field label="Data prevista">
          <input type="date" value={form.scheduledFor} onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })} className={inputClass} />
        </Field>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(async () => {
            const result = await adminAddDeliverable(businessId, { kind: form.kind as never, title: form.title, scheduledFor: form.scheduledFor || null, notes: form.notes });
            if (result.success) setForm({ ...form, title: "", scheduledFor: "" });
            return result;
          }, "Entrega registrada.")}
          className={buttonClass}
        >
          Adicionar entrega
        </button>
        {message && <p role="status" className={`text-[14px] font-medium ${message.ok ? "text-whatsapp" : "text-red-700"}`}>{message.text}</p>}
      </div>
    </section>
  );
}
