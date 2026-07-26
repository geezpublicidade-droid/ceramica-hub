"use client";

import { useState, useTransition } from "react";
import { createAdCampaign } from "@/lib/actions/admin-ads";
import type { AdPlacement } from "@/lib/services/ads";

const inputClass = "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[16px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[15px] font-medium text-foreground";

type FormState = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  placementId: string;
  title: string;
  description: string;
  targetUrl: string;
  startsAt: string;
  endsAt: string;
  budgetCents: string;
  negotiatedValueCents: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
};

const initialState: FormState = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  placementId: "",
  title: "",
  description: "",
  targetUrl: "",
  startsAt: "",
  endsAt: "",
  budgetCents: "",
  negotiatedValueCents: "",
  desktopImageUrl: "",
  mobileImageUrl: "",
};

export function NewCampaignForm({ placements }: { placements: AdPlacement[] }) {
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toCents(value: string): number | null {
    const n = Number(value.replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createAdCampaign({
        companyName: form.companyName,
        contactName: form.contactName,
        email: form.email,
        phone: form.phone,
        placementId: form.placementId,
        title: form.title,
        description: form.description,
        targetUrl: form.targetUrl,
        startsAt: form.startsAt,
        endsAt: form.endsAt,
        budgetCents: toCents(form.budgetCents),
        negotiatedValueCents: toCents(form.negotiatedValueCents),
        desktopImageUrl: form.desktopImageUrl,
        mobileImageUrl: form.mobileImageUrl,
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
        <p className="text-[17px] font-semibold text-foreground">Campanha criada como pendente de revisão.</p>
        <button type="button" onClick={() => setDone(false)} className="mt-4 text-[15px] font-medium text-primary underline">
          Cadastrar outra campanha
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-border bg-white/70 p-6">
      <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">Anunciante</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label>
          <span className={labelClass}>Nome da empresa</span>
          <input className={inputClass} value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Nome do contato</span>
          <input className={inputClass} value={form.contactName} onChange={(e) => update("contactName", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>E-mail</span>
          <input type="email" className={inputClass} value={form.email} onChange={(e) => update("email", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Telefone</span>
          <input className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </label>
      </div>

      <p className="mt-2 text-[15px] font-medium uppercase tracking-[0.15em] text-muted">Campanha</p>
      <label>
        <span className={labelClass}>Posição</span>
        <select className={inputClass} value={form.placementId} onChange={(e) => update("placementId", e.target.value)}>
          <option value="">Selecione</option>
          {placements.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.width}x{p.height})
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className={labelClass}>Título</span>
        <input className={inputClass} value={form.title} onChange={(e) => update("title", e.target.value)} />
      </label>
      <label>
        <span className={labelClass}>Descrição curta (opcional, aparece ao lado da imagem em banners de destaque)</span>
        <textarea
          className={inputClass}
          rows={2}
          maxLength={200}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </label>
      <label>
        <span className={labelClass}>URL de destino</span>
        <input className={inputClass} value={form.targetUrl} onChange={(e) => update("targetUrl", e.target.value)} placeholder="https://..." />
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label>
          <span className={labelClass}>Início da veiculação</span>
          <input type="date" className={inputClass} value={form.startsAt} onChange={(e) => update("startsAt", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Fim da veiculação</span>
          <input type="date" className={inputClass} value={form.endsAt} onChange={(e) => update("endsAt", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Orçamento (R$, opcional)</span>
          <input className={inputClass} value={form.budgetCents} onChange={(e) => update("budgetCents", e.target.value)} placeholder="0,00" />
        </label>
        <label>
          <span className={labelClass}>Valor negociado (R$, opcional)</span>
          <input
            className={inputClass}
            value={form.negotiatedValueCents}
            onChange={(e) => update("negotiatedValueCents", e.target.value)}
            placeholder="0,00"
          />
        </label>
      </div>

      <p className="mt-2 text-[15px] font-medium uppercase tracking-[0.15em] text-muted">Criativos</p>
      <label>
        <span className={labelClass}>URL da imagem (desktop)</span>
        <input className={inputClass} value={form.desktopImageUrl} onChange={(e) => update("desktopImageUrl", e.target.value)} />
      </label>
      <label>
        <span className={labelClass}>URL da imagem (mobile)</span>
        <input className={inputClass} value={form.mobileImageUrl} onChange={(e) => update("mobileImageUrl", e.target.value)} />
      </label>

      {error && <p className="text-[15px] text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="neu-primary mt-2 self-start rounded-full px-6 py-3 text-[16px] font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Salvando..." : "Criar campanha"}
      </button>
    </form>
  );
}
