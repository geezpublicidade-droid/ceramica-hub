"use client";

import { useState, useTransition } from "react";
import { updateContactAction, deleteContactAction } from "@/lib/actions/contacts";
import type { Contact } from "@/lib/services/contacts";

const inputClass = "rounded-xl border border-border bg-white px-3 py-2 text-[13px] text-foreground outline-none focus:border-primary";

export function ContactRow({ contact, showBusiness }: { contact: Contact; showBusiness?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: contact.name,
    jobTitle: contact.jobTitle ?? "",
    phone: contact.phone ?? "",
    whatsapp: contact.whatsapp ?? "",
    email: contact.email ?? "",
  });

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateContactAction(contact.id, contact.businessId, {
        name: form.name,
        jobTitle: form.jobTitle || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        email: form.email || null,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setEditing(false);
    });
  }

  function handleDelete() {
    if (!confirm(`Excluir o contato "${contact.name}"?`)) return;
    startTransition(() => void deleteContactAction(contact.id, contact.businessId));
  }

  if (editing) {
    return (
      <div className="rounded-2xl border border-border bg-white/70 p-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
          <input className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome" />
          <input className={inputClass} value={form.jobTitle} onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))} placeholder="Cargo" />
          <input className={inputClass} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Telefone" />
          <input className={inputClass} value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} placeholder="WhatsApp" />
          <input className={inputClass} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="E-mail" />
        </div>
        {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}
        <div className="mt-3 flex gap-2">
          <button type="button" disabled={isPending} onClick={handleSave} className="neu-primary rounded-full px-4 py-1.5 text-[13px] font-medium text-white disabled:opacity-60">
            Salvar
          </button>
          <button type="button" onClick={() => setEditing(false)} className="rounded-full border border-border px-4 py-1.5 text-[13px] font-medium text-foreground">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white/60 px-4 py-3">
      <div>
        <p className="text-[15px] font-medium text-foreground">
          {contact.name}
          {contact.isPrimary && (
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-primary">
              Principal
            </span>
          )}
        </p>
        <p className="text-[13px] text-muted">
          {[contact.jobTitle, showBusiness ? contact.businessName : null, contact.phone, contact.whatsapp, contact.email]
            .filter(Boolean)
            .join(" · ") || "Sem dados adicionais"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setEditing(true)} className="text-[12px] font-medium text-primary underline">
          Editar
        </button>
        <button type="button" disabled={isPending} onClick={handleDelete} className="text-[12px] font-medium text-red-600 underline disabled:opacity-60">
          Excluir
        </button>
      </div>
    </div>
  );
}
