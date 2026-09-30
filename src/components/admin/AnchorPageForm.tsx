"use client";

import { useState, useTransition } from "react";
import { updateAnchorPage } from "@/lib/actions/admin-anchors";
import type { AnchorPartner } from "@/lib/services/anchors";

const inputClass = "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[14px] font-medium text-foreground";

/** Endereço, descrição e capa da página pública da âncora (/parceiros/<slug>). */
export function AnchorPageForm({ partner }: { partner: AnchorPartner }) {
  const [form, setForm] = useState({
    slug: partner.slug ?? "",
    description: partner.description ?? "",
    coverUrl: partner.coverUrl ?? "",
    hasPage: partner.hasPage,
  });
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await updateAnchorPage(partner.id, form);
      setMessage(result.success ? { ok: true, text: "Página salva." } : { ok: false, text: result.error });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-3xl border border-border bg-white/70 p-6">
      <p className="text-[14px] font-medium uppercase tracking-[0.15em] text-muted">Página pública</p>
      <label className="flex items-center gap-2 text-[15px] text-foreground">
        <input type="checkbox" checked={form.hasPage} onChange={(e) => setForm((p) => ({ ...p, hasPage: e.target.checked }))} />
        Habilitar página própria (aparece só com o parceiro &quot;Ativo&quot;)
      </label>
      <label>
        <span className={labelClass}>Endereço (slug)</span>
        <input className={inputClass} value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="shopping-sao-caetano" />
      </label>
      <label>
        <span className={labelClass}>Descrição</span>
        <textarea className={inputClass} rows={3} maxLength={1000} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
      </label>
      <label>
        <span className={labelClass}>Imagem de capa (URL)</span>
        <input className={inputClass} value={form.coverUrl} onChange={(e) => setForm((p) => ({ ...p, coverUrl: e.target.value }))} />
      </label>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={isPending} className="neu-primary rounded-full px-6 py-2.5 text-[15px] font-medium text-white disabled:opacity-60">
          {isPending ? "Salvando..." : "Salvar página"}
        </button>
        {message && <span className={`text-[14px] ${message.ok ? "text-foreground" : "text-red-700"}`}>{message.text}</span>}
      </div>
    </form>
  );
}
