"use client";

import { useState, useTransition } from "react";
import { createTaskAction } from "@/lib/actions/tasks";
import { TASK_PRIORITY_LABEL, type TaskPriority } from "@/lib/services/tasks";
import type { AssignableAdmin } from "@/lib/services/admins";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[14px] font-medium text-foreground";

const PRIORITY_OPTIONS = Object.entries(TASK_PRIORITY_LABEL) as [TaskPriority, string][];

export function NewTaskForm({ admins }: { admins: AssignableAdmin[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "media" as TaskPriority,
    dueAt: "",
    ownerAdminId: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!form.title.trim()) {
      setError("Título é obrigatório.");
      return;
    }
    startTransition(async () => {
      const result = await createTaskAction({
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
        ownerAdminId: form.ownerAdminId || null,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setForm({ title: "", description: "", priority: "media", dueAt: "", ownerAdminId: "" });
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
        + Nova tarefa
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-border bg-white/70 p-6">
      <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">Nova tarefa</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className={labelClass}>Título *</span>
          <input className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} />
        </label>
        <label className="sm:col-span-2">
          <span className={labelClass}>Descrição</span>
          <textarea
            className={inputClass}
            rows={2}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </label>
        <label>
          <span className={labelClass}>Prioridade</span>
          <select className={inputClass} value={form.priority} onChange={(e) => set("priority", e.target.value as TaskPriority)}>
            {PRIORITY_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelClass}>Prazo</span>
          <input type="datetime-local" className={inputClass} value={form.dueAt} onChange={(e) => set("dueAt", e.target.value)} />
        </label>
        <label className="sm:col-span-2">
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

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="neu-primary rounded-full px-6 py-3 text-[15px] font-medium text-white disabled:opacity-60"
        >
          {isPending ? "Criando..." : "Criar tarefa"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="neu rounded-full px-6 py-3 text-[15px] font-medium text-foreground">
          Cancelar
        </button>
      </div>
    </form>
  );
}
