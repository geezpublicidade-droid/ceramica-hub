"use client";

import { useState, useTransition } from "react";
import { updateContactAction, deleteContactAction } from "@/lib/actions/contacts";
import type { Contact } from "@/lib/services/contacts";

const inputClass = "w-full rounded-lg border border-border bg-white px-2 py-1 text-[13px] text-foreground outline-none focus:border-primary";

/** Linha de tabela pra Contatos (desktop) -- mesma lógica de editar/excluir
 * do ContactRow em card (ainda usado no mobile), só que a edição vira uma
 * linha colSpan abaixo em vez de substituir o card inteiro. */
export function ContactTableRow({ contact, zebra }: { contact: Contact; zebra?: boolean }) {
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

  const rowClass = `border-b border-border/60 last:border-0 ${zebra ? "bg-black/[0.015]" : ""}`;

  if (editing) {
    return (
      <tr className={rowClass}>
        <td colSpan={6} className="p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
            <input className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome" />
            <input className={inputClass} value={form.jobTitle} onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))} placeholder="Cargo" />
            <input className={inputClass} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Telefone" />
            <input className={inputClass} value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} placeholder="WhatsApp" />
            <input className={inputClass} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="E-mail" />
          </div>
          {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={isPending} onClick={handleSave} className="neu-primary rounded-full px-4 py-1.5 text-[13px] font-medium text-white disabled:opacity-60">
              Salvar
            </button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-full border border-border px-4 py-1.5 text-[13px] font-medium text-foreground">
              Cancelar
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className={rowClass}>
      <td className="px-3 py-2.5 font-medium text-foreground">
        {contact.name}
        {contact.isPrimary && (
          <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-primary">Principal</span>
        )}
      </td>
      <td className="px-3 py-2.5 text-muted">{contact.businessName ?? "—"}</td>
      <td className="px-3 py-2.5 text-muted">{contact.businessCategory ?? "—"}</td>
      <td className="px-3 py-2.5 text-muted">{contact.jobTitle ?? "—"}</td>
      <td className="px-3 py-2.5 text-muted">{[contact.phone, contact.whatsapp, contact.email].filter(Boolean).join(" · ") || "—"}</td>
      <td className="px-3 py-2.5 text-right">
        <button type="button" onClick={() => setEditing(true)} className="tap text-[12px] font-medium text-primary underline">
          Editar
        </button>
        <button type="button" disabled={isPending} onClick={handleDelete} className="ml-3 text-[12px] font-medium text-red-600 underline disabled:opacity-60">
          Excluir
        </button>
      </td>
    </tr>
  );
}
