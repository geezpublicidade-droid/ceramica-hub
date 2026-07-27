"use client";

import { useState, useTransition } from "react";
import { createListing } from "@/lib/actions/admin-real-estate";

const inputClass = "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[14px] font-medium text-foreground";

const initial = {
  title: "",
  description: "",
  listingType: "locacao" as "venda" | "locacao",
  spaceType: "sala_comercial" as "laje_inteira" | "sala_comercial",
  areaM2: "",
  priceCents: "",
  towerId: "",
  floor: "",
  roomNumber: "",
  availabilityStatus: "sob_consulta" as "disponivel" | "indisponivel" | "sob_consulta",
  agencyName: "",
  contactWhatsapp: "",
  contactLink: "",
  photoUrl: "",
};

export function NewListingForm({ towers }: { towers: { id: string; name: string }[] }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof typeof initial>(key: K, value: (typeof initial)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createListing({
        ...form,
        areaM2: form.areaM2 ? Number(form.areaM2) : null,
        priceCents: form.priceCents ? Math.round(Number(form.priceCents.replace(",", ".")) * 100) : null,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setForm(initial);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-3xl border border-border bg-white/70 p-6">
      <p className="text-[14px] font-medium uppercase tracking-[0.15em] text-muted">Novo imóvel</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label>
          <span className={labelClass}>Título</span>
          <input className={inputClass} value={form.title} onChange={(e) => update("title", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Imobiliária responsável</span>
          <input className={inputClass} value={form.agencyName} onChange={(e) => update("agencyName", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Tipo</span>
          <select className={inputClass} value={form.listingType} onChange={(e) => update("listingType", e.target.value as "venda" | "locacao")}>
            <option value="locacao">Locação</option>
            <option value="venda">Venda</option>
          </select>
        </label>
        <label>
          <span className={labelClass}>Espaço</span>
          <select className={inputClass} value={form.spaceType} onChange={(e) => update("spaceType", e.target.value as "laje_inteira" | "sala_comercial")}>
            <option value="sala_comercial">Sala comercial</option>
            <option value="laje_inteira">Laje inteira</option>
          </select>
        </label>
        <label>
          <span className={labelClass}>Metragem (m²)</span>
          <input type="number" min={1} className={inputClass} value={form.areaM2} onChange={(e) => update("areaM2", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Preço (R$, opcional)</span>
          <input className={inputClass} value={form.priceCents} onChange={(e) => update("priceCents", e.target.value)} placeholder="0,00" />
        </label>
        <label>
          <span className={labelClass}>Torre</span>
          <select className={inputClass} value={form.towerId} onChange={(e) => update("towerId", e.target.value)}>
            <option value="">Selecione</option>
            {towers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelClass}>Andar</span>
          <input className={inputClass} value={form.floor} onChange={(e) => update("floor", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Sala</span>
          <input className={inputClass} value={form.roomNumber} onChange={(e) => update("roomNumber", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Disponibilidade</span>
          <select className={inputClass} value={form.availabilityStatus} onChange={(e) => update("availabilityStatus", e.target.value as typeof form.availabilityStatus)}>
            <option value="sob_consulta">Sob consulta</option>
            <option value="disponivel">Disponível</option>
            <option value="indisponivel">Indisponível</option>
          </select>
        </label>
        <label>
          <span className={labelClass}>WhatsApp de contato</span>
          <input className={inputClass} value={form.contactWhatsapp} onChange={(e) => update("contactWhatsapp", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Link de contato (opcional)</span>
          <input className={inputClass} value={form.contactLink} onChange={(e) => update("contactLink", e.target.value)} placeholder="https://..." />
        </label>
        <label>
          <span className={labelClass}>URL da foto</span>
          <input className={inputClass} value={form.photoUrl} onChange={(e) => update("photoUrl", e.target.value)} placeholder="https://..." />
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
