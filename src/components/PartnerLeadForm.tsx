"use client";

import { useState } from "react";
import { submitPartnerLead } from "@/lib/actions/partner-leads";
import { TurnstileWidget } from "@/components/TurnstileWidget";

type FormState = {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  message: string;
};

const EMPTY_FORM: FormState = { businessName: "", contactName: "", email: "", phone: "", message: "" };

export function PartnerLeadForm() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);
    const result = await submitPartnerLead({ ...form, turnstileToken });
    if (result.success) {
      setStatus("success");
      setForm(EMPTY_FORM);
    } else {
      setStatus("error");
      setError(result.error);
    }
  }

  if (status === "success") {
    return (
      <div className="glass-light rounded-3xl p-8 text-center">
        <p className="text-[18px] font-semibold text-foreground">Recebemos seu contato.</p>
        <p className="mt-2 text-[16px] text-muted">
          Nossa equipe vai analisar e retornar em breve pelo e-mail informado.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-light flex flex-col gap-4 rounded-3xl p-8">
      <div>
        <label className="text-[14px] font-medium text-muted">Nome da empresa</label>
        <input
          required
          value={form.businessName}
          onChange={(e) => setForm({ ...form, businessName: e.target.value })}
          className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-[16px] text-foreground"
        />
      </div>
      <div>
        <label className="text-[14px] font-medium text-muted">Seu nome</label>
        <input
          required
          value={form.contactName}
          onChange={(e) => setForm({ ...form, contactName: e.target.value })}
          className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-[16px] text-foreground"
        />
      </div>
      <div>
        <label className="text-[14px] font-medium text-muted">E-mail</label>
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-[16px] text-foreground"
        />
      </div>
      <div>
        <label className="text-[14px] font-medium text-muted">WhatsApp (opcional)</label>
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-[16px] text-foreground"
        />
      </div>
      <div>
        <label className="text-[14px] font-medium text-muted">Mensagem (opcional)</label>
        <textarea
          rows={4}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-[16px] text-foreground"
        />
      </div>

      <TurnstileWidget onVerify={setTurnstileToken} />

      {error && <p className="text-[14px] text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="neu-primary rounded-full px-7 py-3.5 text-[17px] font-medium text-white disabled:opacity-60"
      >
        {status === "submitting" ? "Enviando..." : "Enviar contato"}
      </button>
    </form>
  );
}
