"use client";

import { useState, useTransition } from "react";
import { createHotel } from "@/lib/actions/admin-hotels";

const inputClass = "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[14px] font-medium text-foreground";

const initial = { name: "", description: "", logoUrl: "", coverPhotoUrl: "", bookingLink: "", whatsapp: "", phone: "", address: "" };

export function NewHotelForm() {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof typeof initial>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createHotel(form);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setForm(initial);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-3xl border border-border bg-white/70 p-6">
      <p className="text-[14px] font-medium uppercase tracking-[0.15em] text-muted">Novo hotel</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label>
          <span className={labelClass}>Nome</span>
          <input className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Endereço</span>
          <input className={inputClass} value={form.address} onChange={(e) => update("address", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>WhatsApp</span>
          <input className={inputClass} value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Telefone</span>
          <input className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Link oficial de reserva</span>
          <input className={inputClass} value={form.bookingLink} onChange={(e) => update("bookingLink", e.target.value)} placeholder="https://..." />
        </label>
        <label>
          <span className={labelClass}>URL do logo</span>
          <input className={inputClass} value={form.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} placeholder="https://..." />
        </label>
        <label>
          <span className={labelClass}>URL da foto de capa</span>
          <input className={inputClass} value={form.coverPhotoUrl} onChange={(e) => update("coverPhotoUrl", e.target.value)} placeholder="https://..." />
        </label>
      </div>
      <label>
        <span className={labelClass}>Descrição</span>
        <textarea className={inputClass} rows={2} value={form.description} onChange={(e) => update("description", e.target.value)} />
      </label>

      {error && <p className="text-[14px] text-red-600">{error}</p>}

      <button type="submit" disabled={isPending} className="neu-primary mt-2 self-start rounded-full px-6 py-3 text-[15px] font-medium text-white disabled:opacity-60">
        {isPending ? "Salvando..." : "Criar rascunho"}
      </button>
    </form>
  );
}
