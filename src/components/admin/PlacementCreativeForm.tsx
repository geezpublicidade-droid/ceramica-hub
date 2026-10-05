"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPlacementCreativeAction } from "@/lib/actions/admin-category-placements";
import type { PlacementCreative } from "@/lib/services/category-placements-admin";

const inputClass = "mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-[14px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[13px] font-medium text-foreground";

const FIELDS: { key: keyof PlacementCreative; label: string; placeholder: string; multiline?: boolean }[] = [
  { key: "headline", label: "Título do slide", placeholder: "Vazio = nome da empresa" },
  { key: "description", label: "Descrição", placeholder: "Vazio = descrição da empresa", multiline: true },
  { key: "ctaLabel", label: "Texto do botão", placeholder: "Vazio = Ver perfil" },
  { key: "targetUrl", label: "Link de destino", placeholder: "Vazio = perfil da empresa (https://… abre em outra aba)" },
  { key: "imageUrl", label: "Imagem (desktop)", placeholder: "https://… — vazio = capa da empresa" },
  { key: "imageMobileUrl", label: "Imagem (celular)", placeholder: "https://… — vazio = a mesma do desktop" },
];

/** Criativo do slide patrocinado no carrossel da categoria; todos os campos são opcionais. */
export function PlacementCreativeForm({ placementId, creative }: { placementId: string; creative: PlacementCreative }) {
  const router = useRouter();
  const [form, setForm] = useState<Record<keyof PlacementCreative, string>>({
    headline: creative.headline ?? "",
    description: creative.description ?? "",
    ctaLabel: creative.ctaLabel ?? "",
    targetUrl: creative.targetUrl ?? "",
    imageUrl: creative.imageUrl ?? "",
    imageMobileUrl: creative.imageMobileUrl ?? "",
  });
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await setPlacementCreativeAction(placementId, form);
        setMessage(result.success ? { ok: true, text: "Criativo salvo." } : { ok: false, text: result.error });
        if (result.success) router.refresh();
      } catch {
        setMessage({ ok: false, text: "Não foi possível salvar agora. Tente de novo." });
      }
    });
  }

  return (
    <details className="rounded-xl border border-border bg-white/60 px-4 py-3">
      <summary className="cursor-pointer text-[14px] font-medium text-foreground">Criativo do carrossel (opcional)</summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {FIELDS.map(({ key, label, placeholder, multiline }) => (
          <label key={key} className={multiline ? "sm:col-span-2" : ""}>
            <span className={labelClass}>{label}</span>
            {multiline ? (
              <textarea
                rows={2}
                className={inputClass}
                value={form[key]}
                placeholder={placeholder}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            ) : (
              <input
                className={inputClass}
                value={form[key]}
                placeholder={placeholder}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            )}
          </label>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={save}
          className="rounded-full border border-border bg-white px-4 py-1.5 text-[13px] font-medium hover:border-primary/40 disabled:opacity-50"
        >
          {isPending ? "Salvando…" : "Salvar criativo"}
        </button>
        {message && <p className={`text-[13px] ${message.ok ? "text-emerald-700" : "text-red-700"}`}>{message.text}</p>}
      </div>
    </details>
  );
}
