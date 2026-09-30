"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createContentItemAction, updateContentItemAction } from "@/lib/actions/content-calendar";
import {
  CONTENT_CHANNEL_LABEL,
  CONTENT_KIND_LABEL,
  type ContentChannel,
  type ContentItem,
  type ContentItemInput,
  type ContentKind,
} from "@/lib/services/content-calendar";
import type { AssignableAdmin } from "@/lib/services/admins";
import type { CompanyListItem } from "@/lib/services/companies";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[14px] font-medium text-foreground";

const KIND_OPTIONS = Object.entries(CONTENT_KIND_LABEL) as [ContentKind, string][];
const CHANNEL_OPTIONS = Object.entries(CONTENT_CHANNEL_LABEL) as [ContentChannel, string][];

type FormState = {
  kind: ContentKind;
  title: string;
  briefing: string;
  body: string;
  channel: ContentChannel | "";
  businessId: string;
  scheduledFor: string;
  ownerAdminId: string;
};

function initialState(item: ContentItem | undefined, defaultDate: string): FormState {
  return {
    kind: item?.kind ?? "post",
    title: item?.title ?? "",
    briefing: item?.briefing ?? "",
    body: item?.body ?? "",
    channel: item?.channel ?? "",
    businessId: item?.businessId ?? "",
    scheduledFor: item?.scheduledFor ?? defaultDate,
    ownerAdminId: item?.ownerAdminId ?? "",
  };
}

function toInput(form: FormState): ContentItemInput {
  return {
    kind: form.kind,
    title: form.title,
    briefing: form.briefing || null,
    body: form.body || null,
    channel: form.channel || null,
    businessId: form.businessId || null,
    scheduledFor: form.scheduledFor,
    ownerAdminId: form.ownerAdminId || null,
  };
}

/** Criação e edição de uma peça do calendário. Com `item`, edita (e
 * cada salvamento gera uma nova versão); sem, cria. */
export function ContentItemForm({
  item,
  defaultDate,
  options,
}: {
  item?: ContentItem;
  defaultDate: string;
  options: { admins: AssignableAdmin[]; companies: CompanyListItem[] };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(Boolean(item));
  const [form, setForm] = useState<FormState>(() => initialState(item, defaultDate));

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const result = item
          ? await updateContentItemAction(item.id, toInput(form))
          : await createContentItemAction(toInput(form));
        if (!result.success) {
          setError(result.error);
          return;
        }
        if (!item) {
          setForm(initialState(undefined, defaultDate));
          setOpen(false);
        }
        router.refresh();
      } catch {
        setError("Não foi possível salvar agora. Tente de novo.");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="neu-primary self-start rounded-full px-5 py-2.5 text-[14px] font-medium text-white"
      >
        + Nova peça
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-border bg-white/70 p-6">
      <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">{item ? "Editar peça" : "Nova peça"}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className={labelClass}>Título *</span>
          <input className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Tipo</span>
          <select className={inputClass} value={form.kind} onChange={(e) => set("kind", e.target.value as ContentKind)}>
            {KIND_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelClass}>Canal</span>
          <select className={inputClass} value={form.channel} onChange={(e) => set("channel", e.target.value as ContentChannel | "")}>
            <option value="">Sem canal definido</option>
            {CHANNEL_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelClass}>Data prevista *</span>
          <input type="date" className={inputClass} value={form.scheduledFor} onChange={(e) => set("scheduledFor", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Responsável</span>
          <select className={inputClass} value={form.ownerAdminId} onChange={(e) => set("ownerAdminId", e.target.value)}>
            <option value="">Sem responsável</option>
            {options.admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.email}
              </option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className={labelClass}>Empresa relacionada</span>
          <select className={inputClass} value={form.businessId} onChange={(e) => set("businessId", e.target.value)}>
            <option value="">Nenhuma (conteúdo do Cerâmica Hub)</option>
            {options.companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className={labelClass}>Briefing</span>
          <textarea className={inputClass} rows={3} value={form.briefing} onChange={(e) => set("briefing", e.target.value)} />
        </label>
        <label className="sm:col-span-2">
          <span className={labelClass}>Texto / legenda</span>
          <textarea className={inputClass} rows={4} value={form.body} onChange={(e) => set("body", e.target.value)} />
        </label>
      </div>

      {error && <p className="text-[14px] text-danger">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="neu-primary rounded-full px-6 py-3 text-[15px] font-medium text-white disabled:opacity-60"
        >
          {isPending ? "Salvando..." : item ? "Salvar alterações" : "Criar peça"}
        </button>
        {!item && (
          <button type="button" onClick={() => setOpen(false)} className="neu rounded-full px-6 py-3 text-[15px] font-medium text-foreground">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
