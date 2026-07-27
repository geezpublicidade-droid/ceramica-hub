"use client";

import { useState, useTransition } from "react";
import { createInstitutionalPartner } from "@/lib/actions/admin-institutional-partners";

const inputClass = "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[14px] font-medium text-foreground";

export function NewPartnerForm() {
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [link, setLink] = useState("");
  const [partnershipType, setPartnershipType] = useState("");
  const [authorizationNote, setAuthorizationNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createInstitutionalPartner({ name, logoUrl, link, partnershipType, authorizationNote });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setName("");
      setLogoUrl("");
      setLink("");
      setPartnershipType("");
      setAuthorizationNote("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-3xl border border-border bg-white/70 p-6">
      <p className="text-[14px] font-medium uppercase tracking-[0.15em] text-muted">Novo parceiro institucional</p>
      <p className="text-[13px] text-muted">
        Entra sempre como &quot;Rascunho&quot; — nunca aparece publicamente até você confirmar a autorização real e mudar pra &quot;Ativo&quot;.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label>
          <span className={labelClass}>Nome</span>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Prefeitura de São Caetano do Sul" />
        </label>
        <label>
          <span className={labelClass}>Tipo de vínculo</span>
          <input className={inputClass} value={partnershipType} onChange={(e) => setPartnershipType(e.target.value)} placeholder="Ex: apoio institucional, parceiro comercial" />
        </label>
        <label>
          <span className={labelClass}>URL do logo (opcional)</span>
          <input className={inputClass} value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
        </label>
        <label>
          <span className={labelClass}>Link (opcional)</span>
          <input className={inputClass} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
        </label>
      </div>
      <label>
        <span className={labelClass}>Observação sobre a autorização (documento, e-mail, contato — pra você lembrar depois)</span>
        <textarea className={inputClass} rows={2} value={authorizationNote} onChange={(e) => setAuthorizationNote(e.target.value)} />
      </label>

      {error && <p className="text-[14px] text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="neu-primary mt-2 self-start rounded-full px-6 py-3 text-[15px] font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Salvando..." : "Criar rascunho"}
      </button>
    </form>
  );
}
