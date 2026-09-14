"use client";

import { useState, useTransition } from "react";
import { createEvent } from "@/lib/actions/admin-events";

const inputClass = "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[14px] font-medium text-foreground";

const EVENT_TYPE_LABEL: Record<string, string> = {
  forum_negocios: "Fórum de Negócios",
  workshop: "Workshop",
  networking: "Networking",
  outro: "Outro",
};

const initial = {
  title: "",
  description: "",
  eventType: "forum_negocios",
  startsAt: "",
  endsAt: "",
  location: "",
  coverPhotoUrl: "",
  registrationLink: "",
  whatsapp: "",
  capacity: "",
};

export function NewEventForm() {
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
      const result = await createEvent(form as Parameters<typeof createEvent>[0]);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setForm(initial);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-3xl border border-border bg-white/70 p-6">
      <p className="text-[14px] font-medium uppercase tracking-[0.15em] text-muted">Novo evento</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label>
          <span className={labelClass}>Título</span>
          <input className={inputClass} value={form.title} onChange={(e) => update("title", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Tipo</span>
          <select className={inputClass} value={form.eventType} onChange={(e) => update("eventType", e.target.value)}>
            {Object.entries(EVENT_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelClass}>Início</span>
          <input type="datetime-local" className={inputClass} value={form.startsAt} onChange={(e) => update("startsAt", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Término (opcional)</span>
          <input type="datetime-local" className={inputClass} value={form.endsAt} onChange={(e) => update("endsAt", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Local</span>
          <input className={inputClass} value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Ex: Auditório Torre Way" />
        </label>
        <label>
          <span className={labelClass}>Vagas (opcional)</span>
          <input type="number" min={0} className={inputClass} value={form.capacity} onChange={(e) => update("capacity", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>WhatsApp</span>
          <input className={inputClass} value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Link de inscrição (opcional)</span>
          <input className={inputClass} value={form.registrationLink} onChange={(e) => update("registrationLink", e.target.value)} placeholder="https://..." />
        </label>
        <label className="sm:col-span-2">
          <span className={labelClass}>URL da foto de capa</span>
          <input className={inputClass} value={form.coverPhotoUrl} onChange={(e) => update("coverPhotoUrl", e.target.value)} placeholder="https://..." />
        </label>
      </div>
      <label>
        <span className={labelClass}>Descrição</span>
        <textarea className={inputClass} rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} />
      </label>

      {error && <p className="text-[14px] text-red-600">{error}</p>}

      <button type="submit" disabled={isPending} className="neu-primary mt-2 self-start rounded-full px-6 py-3 text-[15px] font-medium text-white disabled:opacity-60">
        {isPending ? "Salvando..." : "Criar rascunho"}
      </button>
    </form>
  );
}
