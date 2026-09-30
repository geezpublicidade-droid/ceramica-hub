"use client";

import { useState, useTransition } from "react";
import { createLeadAction } from "@/lib/actions/leads";
import { LEAD_SOURCE_LABEL, type LeadSource, type LeadTemperature } from "@/lib/services/leads";
import { TEMPERATURE_LABEL } from "@/lib/lead-temperature";
import { categories } from "@/data/businesses";
import type { AssignableAdmin } from "@/lib/services/admins";
import type { Tower } from "@/lib/services/towers";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[14px] font-medium text-foreground";

const REAL_CATEGORIES = categories.filter((c) => c !== "Todas");
const SOURCE_OPTIONS = Object.entries(LEAD_SOURCE_LABEL) as [LeadSource, string][];
const TEMPERATURE_OPTIONS = Object.entries(TEMPERATURE_LABEL) as [LeadTemperature, string][];

export function NewLeadForm({ admins, towers }: { admins: AssignableAdmin[]; towers: Tower[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    contactName: "",
    companyName: "",
    jobTitle: "",
    phone: "",
    email: "",
    source: "prospeccao" as LeadSource,
    category: "",
    towerId: "",
    productInterest: "",
    estimatedValue: "",
    temperature: "morno" as LeadTemperature,
    ownerAdminId: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!form.contactName.trim()) {
      setError("Nome do contato é obrigatório.");
      return;
    }
    startTransition(async () => {
      const result = await createLeadAction({
        contactName: form.contactName,
        companyName: form.companyName || null,
        jobTitle: form.jobTitle || null,
        phone: form.phone || null,
        email: form.email || null,
        source: form.source,
        category: form.category || null,
        towerId: form.towerId || null,
        productInterest: form.productInterest || null,
        estimatedValueCents: form.estimatedValue ? Math.round(Number(form.estimatedValue) * 100) : null,
        temperature: form.temperature,
        ownerAdminId: form.ownerAdminId || null,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setForm({
        contactName: "",
        companyName: "",
        jobTitle: "",
        phone: "",
        email: "",
        source: "prospeccao",
        category: "",
        towerId: "",
        productInterest: "",
        estimatedValue: "",
        temperature: "morno",
        ownerAdminId: "",
      });
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
        + Novo lead
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-border bg-white/70 p-6">
      <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">Novo lead</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label>
          <span className={labelClass}>Nome do contato *</span>
          <input className={inputClass} value={form.contactName} onChange={(e) => set("contactName", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Empresa</span>
          <input className={inputClass} value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Cargo</span>
          <input className={inputClass} value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Telefone/WhatsApp</span>
          <input className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>E-mail</span>
          <input type="email" className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Origem</span>
          <select className={inputClass} value={form.source} onChange={(e) => set("source", e.target.value as LeadSource)}>
            {SOURCE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelClass}>Categoria</span>
          <select className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">Sem categoria</option>
            {REAL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelClass}>Torre</span>
          <select className={inputClass} value={form.towerId} onChange={(e) => set("towerId", e.target.value)}>
            <option value="">Sem torre</option>
            {towers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelClass}>Produto de interesse</span>
          <input
            className={inputClass}
            placeholder="Ex: plano Destaque, publicidade avulsa"
            value={form.productInterest}
            onChange={(e) => set("productInterest", e.target.value)}
          />
        </label>
        <label>
          <span className={labelClass}>Valor estimado (R$)</span>
          <input
            type="number"
            step="0.01"
            className={inputClass}
            value={form.estimatedValue}
            onChange={(e) => set("estimatedValue", e.target.value)}
          />
        </label>
        <label>
          <span className={labelClass}>Temperatura</span>
          <select
            className={inputClass}
            value={form.temperature}
            onChange={(e) => set("temperature", e.target.value as LeadTemperature)}
          >
            {TEMPERATURE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelClass}>Responsável</span>
          <select className={inputClass} value={form.ownerAdminId} onChange={(e) => set("ownerAdminId", e.target.value)}>
            <option value="">Sem responsável</option>
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.email}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="text-[14px] text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="neu-primary rounded-full px-6 py-3 text-[15px] font-medium text-white disabled:opacity-60"
        >
          {isPending ? "Criando..." : "Criar lead"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="neu rounded-full px-6 py-3 text-[15px] font-medium text-foreground">
          Cancelar
        </button>
      </div>
    </form>
  );
}
