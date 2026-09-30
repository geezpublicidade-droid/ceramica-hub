"use client";

import { useState, useTransition } from "react";
import { setPlacementActive, updatePlacement } from "@/lib/actions/admin-ads";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatCents, formatDateBR, parseCentsInput } from "@/lib/utils";
import { AD_PLACEMENT_FORMAT_LABEL } from "@/lib/ad-placement-formats";
import { PlacementExtraFields, extrasFromPlacement, extrasToInput } from "@/components/admin/PlacementExtraFields";
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

/** Retângulo escalado mostrando a proporção real da posição -- teto de
 * 96x40px, sem estourar o card mesmo pra posições bem largas ou altas. */
function SizePreview({ width, height }: { width: number; height: number }) {
  const scale = Math.min(96 / width, 40 / height, 1);
  return (
    <div className="flex h-12 w-24 shrink-0 items-center justify-center rounded-lg bg-muted/10">
      <div
        className="flex items-center justify-center rounded-sm border border-primary/40 bg-primary/10"
        style={{ width: Math.max(6, width * scale), height: Math.max(6, height * scale) }}
      >
        <span className="px-0.5 text-center text-[9px] leading-none text-primary/70">
          {width}×{height}
        </span>
      </div>
    </div>
  );
}

/** Ficha comercial do espaço: formato, dimensões (desktop e mobile), valores e especificações do criativo. */
function PlacementSpecs({ placement }: { placement: PlacementInventory }) {
  const lines = [
    placement.format && `Formato: ${AD_PLACEMENT_FORMAT_LABEL[placement.format]}`,
    `Desktop ${placement.width}×${placement.height}px${placement.mobileWidth && placement.mobileHeight ? ` · Mobile ${placement.mobileWidth}×${placement.mobileHeight}px` : ""}`,
    placement.productionPriceCents != null && `Produção do criativo: ${formatCents(placement.productionPriceCents)}`,
    placement.creativeDeadlineDays != null && `Criativo com ${placement.creativeDeadlineDays} dia(s) de antecedência`,
    placement.creativeSpecs,
  ].filter(Boolean);
  return (
    <ul className="mt-1 text-[12px] text-muted">
      {lines.map((line) => (
        <li key={String(line)}>{line}</li>
      ))}
    </ul>
  );
}

export function PlacementCard({ placement }: { placement: PlacementInventory }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [extras, setExtras] = useState(() => extrasFromPlacement(placement));
  const [form, setForm] = useState({
    name: placement.name,
    description: placement.description ?? "",
    width: String(placement.width),
    height: String(placement.height),
    monthlyPrice: placement.monthlyPriceCents != null ? String(placement.monthlyPriceCents / 100).replace(".", ",") : "",
  });

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updatePlacement(placement.id, {
        name: form.name,
        description: form.description,
        width: Number(form.width),
        height: Number(form.height),
        monthlyPriceCents: parseCentsInput(form.monthlyPrice),
        ...extrasToInput(extras),
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setEditing(false);
    });
  }

  return (
    <div className={`flex flex-col gap-3 rounded-3xl border border-border bg-white/70 p-5 ${!placement.active ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <SizePreview width={placement.width} height={placement.height} />
        <div className="flex flex-col items-end gap-1">
          <StatusBadge label={STATUS_LABEL[placement.status]} className={STATUS_CLASS[placement.status]} />
          {!placement.active && <StatusBadge label="Arquivada" className="bg-muted/20 text-muted" />}
        </div>
      </div>

      <div>
        <p className="text-[16px] font-semibold text-foreground">{placement.name}</p>
        <p className="text-[13px] text-muted">
          key: <code className="text-[12px]">{placement.key}</code>
        </p>
        <p className="text-[13px] text-muted">
          {placement.monthlyPriceCents != null ? `${formatCents(placement.monthlyPriceCents)}/mês` : "sem preço definido"}
        </p>
        <PlacementSpecs placement={placement} />
        {placement.occupant && (
          <p className="mt-1 text-[13px] text-muted">
            {placement.status === "reservado" ? "Reservado por" : "Ocupado por"} {placement.occupant.advertiserName} —{" "}
            {placement.occupant.title} · {formatDateBR(placement.occupant.startsAt)} a {formatDateBR(placement.occupant.endsAt)}
          </p>
        )}
        {placement.occupant && !placement.occupant.hasCreative && (
          <p className="mt-1 text-[13px] font-medium text-orange-700">Criativo ainda não enviado pelo anunciante</p>
        )}
        {placement.pendingCount > 0 && (
          <p className="mt-1 text-[13px] text-purple-700">
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

      {editing && (
        <div className="flex flex-col gap-3 border-t border-border pt-4">
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label>
              <span className={labelClass}>Largura (px)</span>
              <input className={inputClass} value={form.width} onChange={(e) => setForm((f) => ({ ...f, width: e.target.value }))} />
            </label>
            <label>
              <span className={labelClass}>Altura (px)</span>
              <input className={inputClass} value={form.height} onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))} />
            </label>
          </div>
          <label>
            <span className={labelClass}>Descrição</span>
            <textarea
              className={inputClass}
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <PlacementExtraFields value={extras} onChange={setExtras} />
          {error && <p className="text-[14px] text-red-600">{error}</p>}
          <button
            type="button"
            disabled={isPending}
            onClick={handleSave}
            className="neu-primary self-start rounded-full px-6 py-2.5 text-[15px] font-medium text-white disabled:opacity-60"
          >
            {isPending ? "Salvando..." : "Salvar"}
          </button>
        </div>
      )}
    </div>
  );
}
