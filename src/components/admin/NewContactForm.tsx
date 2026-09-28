"use client";

import { useState, useTransition } from "react";
import { createContactAction } from "@/lib/actions/contacts";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[14px] font-medium text-foreground";

export function NewContactForm({ businesses }: { businesses: { id: string; name: string }[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    businessId: "",
    name: "",
    jobTitle: "",
    phone: "",
    whatsapp: "",
    email: "",
    isPrimary: false,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!form.businessId) {
      setError("Selecione a empresa.");
      return;
    }
    if (!form.name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }
    startTransition(async () => {
      const result = await createContactAction({
        businessId: form.businessId,
        name: form.name,
        jobTitle: form.jobTitle || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        email: form.email || null,
        isPrimary: form.isPrimary,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setForm({ businessId: "", name: "", jobTitle: "", phone: "", whatsapp: "", email: "", isPrimary: false });
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="neu-primary self-start rounded-full px-5 py-2.5 text-[14px] font-medium text-white"
      >
        + Novo contato
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-border bg-white/70 p-6">
      <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">Novo contato</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="sm:col-span-2">
          <span className={labelClass}>Empresa *</span>
          <select className={inputClass} value={form.businessId} onChange={(e) => set("businessId", e.target.value)}>
            <option value="">Selecione</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelClass}>Nome *</span>
          <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Cargo</span>
          <input className={inputClass} value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Telefone</span>
          <input className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>WhatsApp</span>
          <input className={inputClass} value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>E-mail</span>
          <input type="email" className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} />
        </label>
        <label className="flex items-center gap-2 pt-6">
          <input type="checkbox" checked={form.isPrimary} onChange={(e) => set("isPrimary", e.target.checked)} />
          <span className={labelClass}>Contato principal</span>
        </label>
      </div>

      {error && <p className="text-[14px] text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="neu-primary rounded-full px-6 py-3 text-[15px] font-medium text-white disabled:opacity-60"
        >
          {isPending ? "Criando..." : "Criar contato"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="neu rounded-full px-6 py-3 text-[15px] font-medium text-foreground">
          Cancelar
        </button>
      </div>
    </form>
  );
}
