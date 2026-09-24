"use client";

import { useState, useTransition } from "react";
import { createPlacement } from "@/lib/actions/admin-ads";

const inputClass = "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[16px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[15px] font-medium text-foreground";

type FormState = { key: string; name: string; description: string; width: string; height: string; monthlyPrice: string };

const initialState: FormState = { key: "", name: "", description: "", width: "", height: "", monthlyPrice: "" };

export function NewPlacementForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toCents(value: string): number | null {
    if (!value.trim()) return null;
    const n = Number(value.replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createPlacement({
        key: form.key.trim().toLowerCase(),
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
      setDone(true);
      setForm(initialState);
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-white/70 p-6 text-center">
        <p className="text-[17px] font-semibold text-foreground">Espaço criado — já aparece na lista abaixo e no formulário de campanha.</p>
        <button type="button" onClick={() => setDone(false)} className="mt-4 text-[15px] font-medium text-primary underline">
          Cadastrar outro espaço
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-border bg-white/70 p-6">
      <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">Novo espaço de anúncio</p>
      <label>
        <span className={labelClass}>Key (usada no código, ex: hero_lateral)</span>
        <input className={inputClass} value={form.key} onChange={(e) => update("key", e.target.value)} placeholder="minusculo_com_underscore" />
      </label>
      <label>
        <span className={labelClass}>Nome</span>
        <input className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} />
      </label>
      <label>
        <span className={labelClass}>Descrição (opcional)</span>
        <textarea className={inputClass} rows={2} value={form.description} onChange={(e) => update("description", e.target.value)} />
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label>
          <span className={labelClass}>Largura (px)</span>
          <input className={inputClass} value={form.width} onChange={(e) => update("width", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Altura (px)</span>
          <input className={inputClass} value={form.height} onChange={(e) => update("height", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Preço mensal (R$, opcional)</span>
          <input className={inputClass} value={form.monthlyPrice} onChange={(e) => update("monthlyPrice", e.target.value)} placeholder="Ex: 800,00" />
        </label>
      </div>

      {error && <p className="text-[15px] text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="neu-primary mt-2 self-start rounded-full px-6 py-3 text-[16px] font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Salvando..." : "Criar espaço"}
      </button>
    </form>
  );
}
