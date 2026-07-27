"use client";

import { useState, useTransition } from "react";
import { createMeetingSpace } from "@/lib/actions/admin-meeting-spaces";

const inputClass = "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[14px] font-medium text-foreground";

const initial = {
  name: "",
  spaceType: "sala_reuniao" as "auditorio" | "sala_reuniao",
  capacity: "",
  description: "",
  photoUrl: "",
  equipment: "",
  towerId: "",
  floor: "",
  roomNumber: "",
  pricingInfo: "",
  contactWhatsapp: "",
  contactLink: "",
  rules: "",
};

export function NewMeetingSpaceForm({ towers }: { towers: { id: string; name: string }[] }) {
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
      const result = await createMeetingSpace({
        ...form,
        capacity: form.capacity ? Number(form.capacity) : null,
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
      <p className="text-[14px] font-medium uppercase tracking-[0.15em] text-muted">Novo espaço</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label>
          <span className={labelClass}>Nome</span>
          <input className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Tipo</span>
          <select className={inputClass} value={form.spaceType} onChange={(e) => update("spaceType", e.target.value as "auditorio" | "sala_reuniao")}>
            <option value="sala_reuniao">Sala de reunião</option>
            <option value="auditorio">Auditório</option>
          </select>
        </label>
        <label>
          <span className={labelClass}>Capacidade (pessoas)</span>
          <input type="number" min={1} className={inputClass} value={form.capacity} onChange={(e) => update("capacity", e.target.value)} />
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
          <span className={labelClass}>WhatsApp de contato</span>
          <input className={inputClass} value={form.contactWhatsapp} onChange={(e) => update("contactWhatsapp", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Link de contato/formulário (opcional)</span>
          <input className={inputClass} value={form.contactLink} onChange={(e) => update("contactLink", e.target.value)} placeholder="https://..." />
        </label>
        <label>
          <span className={labelClass}>URL da foto</span>
          <input className={inputClass} value={form.photoUrl} onChange={(e) => update("photoUrl", e.target.value)} placeholder="https://..." />
        </label>
        <label>
          <span className={labelClass}>Valor da locação (opcional, texto livre)</span>
          <input className={inputClass} value={form.pricingInfo} onChange={(e) => update("pricingInfo", e.target.value)} placeholder="Ex: consultar disponibilidade" />
        </label>
      </div>
      <label>
        <span className={labelClass}>Equipamentos</span>
        <input className={inputClass} value={form.equipment} onChange={(e) => update("equipment", e.target.value)} placeholder="Ex: projetor, som, videoconferência" />
      </label>
      <label>
        <span className={labelClass}>Descrição</span>
        <textarea className={inputClass} rows={2} value={form.description} onChange={(e) => update("description", e.target.value)} />
      </label>
      <label>
        <span className={labelClass}>Regras de uso</span>
        <textarea className={inputClass} rows={2} value={form.rules} onChange={(e) => update("rules", e.target.value)} />
      </label>

      {error && <p className="text-[14px] text-red-600">{error}</p>}

      <button type="submit" disabled={isPending} className="neu-primary mt-2 self-start rounded-full px-6 py-3 text-[15px] font-medium text-white disabled:opacity-60">
        {isPending ? "Salvando..." : "Criar rascunho"}
      </button>
    </form>
  );
}
