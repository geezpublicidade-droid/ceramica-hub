"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTicketAction } from "@/lib/actions/support";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[14px] font-medium text-foreground";

/** Mesmo form serve empresa e membro -- os dois chamam a mesma action
 * (`createTicketAction` deriva o dono do chamado da própria sessão, nunca
 * de um campo daqui). Só o valor inicial de nome/contato muda por página. */
export function NewTicketForm({ defaultName, defaultContact }: { defaultName: string; defaultContact: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ requesterName: defaultName, requesterContact: defaultContact, subject: "", message: "" });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createTicketAction(form);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setForm((prev) => ({ ...prev, subject: "", message: "" }));
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-3xl border border-border bg-white/70 p-6">
      <p className="text-[14px] font-medium uppercase tracking-[0.15em] text-muted">Abrir chamado</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label>
          <span className={labelClass}>Seu nome</span>
          <input className={inputClass} value={form.requesterName} onChange={(e) => update("requesterName", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Contato (e-mail ou WhatsApp)</span>
          <input className={inputClass} value={form.requesterContact} onChange={(e) => update("requesterContact", e.target.value)} />
        </label>
      </div>
      <label>
        <span className={labelClass}>Assunto</span>
        <input
          className={inputClass}
          value={form.subject}
          onChange={(e) => update("subject", e.target.value)}
          placeholder="Ex: Dúvida sobre meu plano"
        />
      </label>
      <label>
        <span className={labelClass}>Mensagem</span>
        <textarea
          className={inputClass}
          rows={4}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="Descreva sua dúvida ou problema..."
        />
      </label>

      {error && <p className="text-[14px] text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="neu-primary mt-2 self-start rounded-full px-6 py-3 text-[15px] font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Enviando..." : "Enviar chamado"}
      </button>
    </form>
  );
}
