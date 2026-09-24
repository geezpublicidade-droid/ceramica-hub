"use client";

import { useState, useTransition } from "react";
import { setPlacementActive, updatePlacement } from "@/lib/actions/admin-ads";
import { formatCents } from "@/lib/utils";
import type { PlacementInventory } from "@/lib/services/ads";

const STATUS_LABEL: Record<PlacementInventory["status"], string> = {
  vago: "Vago",
  aguardando_revisao: "Aguardando revisão",
  reservado: "Reservado",
  ativo: "Ativo",
  expirando: "Expirando",
};

const STATUS_CLASS: Record<PlacementInventory["status"], string> = {
  vago: "bg-muted/20 text-muted",
  aguardando_revisao: "bg-purple-100 text-purple-700",
  reservado: "bg-blue-100 text-blue-700",
  ativo: "bg-green-100 text-green-700",
  expirando: "bg-orange-100 text-orange-700",
};

const inputClass = "mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2 text-[15px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[13px] font-medium text-foreground";

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

export function PlacementRow({ placement }: { placement: PlacementInventory }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: placement.name,
    description: placement.description ?? "",
    width: String(placement.width),
    height: String(placement.height),
    monthlyPrice: placement.monthlyPriceCents != null ? String(placement.monthlyPriceCents / 100).replace(".", ",") : "",
  });

  function toCents(value: string): number | null {
    if (!value.trim()) return null;
    const n = Number(value.replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updatePlacement(placement.id, {
        name: form.name,
        description: form.description,
        width: Number(form.width),
        height: Number(form.height),
        monthlyPriceCents: toCents(form.monthlyPrice),
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setEditing(false);
    });
  }

  return (
    <div className={`rounded-3xl border border-border bg-white/70 p-6 ${!placement.active ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[17px] font-semibold text-foreground">{placement.name}</p>
            <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${STATUS_CLASS[placement.status]}`}>
              {STATUS_LABEL[placement.status]}
            </span>
            {!placement.active && <span className="rounded-full bg-muted/20 px-2.5 py-0.5 text-[12px] font-medium text-muted">Arquivada</span>}
          </div>
          <p className="text-[14px] text-muted">
            key: <code className="text-[13px]">{placement.key}</code> · {placement.width}x{placement.height}px ·{" "}
            {placement.monthlyPriceCents != null ? `${formatCents(placement.monthlyPriceCents)}/mês` : "sem preço definido"}
          </p>
          {placement.occupant && (
            <p className="mt-1 text-[14px] text-muted">
              {placement.status === "reservado" ? "Reservado por" : "Ocupado por"} {placement.occupant.advertiserName} —{" "}
              {placement.occupant.title} · {formatDate(placement.occupant.startsAt)} a {formatDate(placement.occupant.endsAt)}
            </p>
          )}
          {placement.pendingCount > 0 && (
            <p className="mt-1 text-[14px] text-purple-700">
              {placement.pendingCount} proposta{placement.pendingCount > 1 ? "s" : ""} aguardando revisão
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="neu rounded-full px-4 py-2 text-[14px] font-medium text-foreground"
          >
            {editing ? "Cancelar" : "Editar"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => void setPlacementActive(placement.id, !placement.active))}
            className="rounded-full border border-border px-4 py-2 text-[14px] font-medium text-foreground disabled:opacity-60"
          >
            {placement.active ? "Arquivar" : "Reativar"}
          </button>
        </div>
      </div>

      {editing && (
        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2">
          <label>
            <span className={labelClass}>Nome</span>
            <input className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
          <label>
            <span className={labelClass}>Preço mensal (R$, opcional)</span>
            <input
              className={inputClass}
              value={form.monthlyPrice}
              onChange={(e) => setForm((f) => ({ ...f, monthlyPrice: e.target.value }))}
              placeholder="Ex: 800,00"
            />
          </label>
          <label>
            <span className={labelClass}>Largura (px)</span>
            <input className={inputClass} value={form.width} onChange={(e) => setForm((f) => ({ ...f, width: e.target.value }))} />
          </label>
          <label>
            <span className={labelClass}>Altura (px)</span>
            <input className={inputClass} value={form.height} onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))} />
          </label>
          <label className="sm:col-span-2">
            <span className={labelClass}>Descrição</span>
            <textarea
              className={inputClass}
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          {error && <p className="text-[14px] text-red-600 sm:col-span-2">{error}</p>}
          <button
            type="button"
            disabled={isPending}
            onClick={handleSave}
            className="neu-primary self-start rounded-full px-6 py-2.5 text-[15px] font-medium text-white disabled:opacity-60 sm:col-span-2"
          >
            {isPending ? "Salvando..." : "Salvar"}
          </button>
        </div>
      )}
    </div>
  );
}
