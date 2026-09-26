"use client";

import { useState } from "react";
import { submitPartnerLead } from "@/lib/actions/partner-leads";
import { TurnstileWidget } from "@/components/TurnstileWidget";

type Interest = "anunciante" | "patrocinador";

const INTEREST_OPTIONS: { value: Interest; label: string; hint: string }[] = [
  { value: "anunciante", label: "Anunciante", hint: "Banners e campanhas na plataforma" },
  { value: "patrocinador", label: "Patrocinador", hint: "Presença institucional exclusiva" },
];

type FormState = {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  message: string;
  interest: Interest;
};

const EMPTY_FORM: FormState = {
  businessName: "",
  contactName: "",
  email: "",
  phone: "",
  message: "",
  interest: "anunciante",
};

export function PartnerLeadForm({ defaultInterest = "anunciante" }: { defaultInterest?: Interest }) {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, interest: defaultInterest });
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
      setForm({ ...EMPTY_FORM, interest: defaultInterest });
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
      <fieldset>
        <legend className="text-[14px] font-medium text-muted">Quero ser</legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {INTEREST_OPTIONS.map((option) => {
            const selected = form.interest === option.value;
            return (
              <label
                key={option.value}
                className={`cursor-pointer rounded-2xl border-2 px-4 py-3 transition-colors ${
                  selected ? "border-primary bg-primary/10" : "border-border bg-white hover:border-foreground/30"
                }`}
              >
                <input
                  type="radio"
                  name="interest"
                  value={option.value}
                  checked={selected}
                  onChange={() => setForm({ ...form, interest: option.value })}
                  className="sr-only"
                />
                <span className="block text-[16px] font-semibold text-foreground">{option.label}</span>
                <span className="mt-0.5 block text-[13px] leading-snug text-muted">{option.hint}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
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
