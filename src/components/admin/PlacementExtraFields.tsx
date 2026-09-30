"use client";

import { AD_PLACEMENT_FORMATS, AD_PLACEMENT_FORMAT_LABEL, type AdPlacementFormat } from "@/lib/ad-placement-formats";
import { parseCentsInput } from "@/lib/utils";
import type { AdPlacement } from "@/lib/services/ads";

/** Campos de inventário (Fase 3.8) compartilhados entre o form de novo espaço e a edição no card. */
export type PlacementExtras = {
  format: string;
  mobileWidth: string;
  mobileHeight: string;
  productionPrice: string;
  creativeSpecs: string;
  creativeDeadlineDays: string;
};

export const EMPTY_EXTRAS: PlacementExtras = {
  format: "",
  mobileWidth: "",
  mobileHeight: "",
  productionPrice: "",
  creativeSpecs: "",
  creativeDeadlineDays: "",
};

export function extrasFromPlacement(placement: AdPlacement): PlacementExtras {
  return {
    format: placement.format ?? "",
    mobileWidth: placement.mobileWidth != null ? String(placement.mobileWidth) : "",
    mobileHeight: placement.mobileHeight != null ? String(placement.mobileHeight) : "",
    productionPrice: placement.productionPriceCents != null ? String(placement.productionPriceCents / 100).replace(".", ",") : "",
    creativeSpecs: placement.creativeSpecs ?? "",
    creativeDeadlineDays: placement.creativeDeadlineDays != null ? String(placement.creativeDeadlineDays) : "",
  };
}

const toIntOrNull = (value: string): number | null => (value.trim() === "" ? null : Number(value));

/** Converte o estado do form (strings) no formato que createPlacement/updatePlacement esperam. */
export function extrasToInput(extras: PlacementExtras) {
  return {
    format: (extras.format || null) as AdPlacementFormat | null,
    mobileWidth: toIntOrNull(extras.mobileWidth),
    mobileHeight: toIntOrNull(extras.mobileHeight),
    productionPriceCents: parseCentsInput(extras.productionPrice),
    creativeSpecs: extras.creativeSpecs,
    creativeDeadlineDays: toIntOrNull(extras.creativeDeadlineDays),
  };
}

const inputClass = "mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2 text-[15px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[13px] font-medium text-foreground";

export function PlacementExtraFields({ value, onChange }: { value: PlacementExtras; onChange: (next: PlacementExtras) => void }) {
  const set = (key: keyof PlacementExtras) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [key]: e.target.value });

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label>
          <span className={labelClass}>Formato</span>
          <select className={inputClass} value={value.format} onChange={set("format")}>
            <option value="">Não definido</option>
            {AD_PLACEMENT_FORMATS.map((format) => (
              <option key={format} value={format}>
                {AD_PLACEMENT_FORMAT_LABEL[format]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelClass}>Valor de produção do criativo (R$, opcional)</span>
          <input className={inputClass} value={value.productionPrice} onChange={set("productionPrice")} placeholder="Ex: 250,00" />
        </label>
        <label>
          <span className={labelClass}>Largura mobile (px, opcional)</span>
          <input className={inputClass} value={value.mobileWidth} onChange={set("mobileWidth")} />
        </label>
        <label>
          <span className={labelClass}>Altura mobile (px, opcional)</span>
          <input className={inputClass} value={value.mobileHeight} onChange={set("mobileHeight")} />
        </label>
      </div>
      <label>
        <span className={labelClass}>Especificações do criativo (peso máximo, formato de arquivo...)</span>
        <textarea className={inputClass} rows={2} maxLength={500} value={value.creativeSpecs} onChange={set("creativeSpecs")} />
      </label>
      <label>
        <span className={labelClass}>Antecedência para entregar o criativo (dias, opcional)</span>
        <input className={inputClass} value={value.creativeDeadlineDays} onChange={set("creativeDeadlineDays")} />
      </label>
    </div>
  );
}
