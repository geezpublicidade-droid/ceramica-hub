"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCampaignAction, createTemplateAction } from "@/lib/actions/email-marketing";
import { EMAIL_KIND_LABEL, type EmailKind, type EmailTemplate } from "@/lib/services/email-marketing";
import type { Audience } from "@/lib/services/marketing-audiences";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[14px] font-medium text-foreground";
const KIND_OPTIONS = Object.entries(EMAIL_KIND_LABEL) as [EmailKind, string][];

type Draft = { name: string; kind: EmailKind; subject: string; bodyHtml: string; audienceId: string };

const EMPTY_DRAFT: Draft = { name: "", kind: "newsletter", subject: "", bodyHtml: "", audienceId: "" };

/** Escreve um e-mail: pode partir de um template, e ser salvo como template
 * novo ou como campanha (rascunho) para um público. O envio é um passo à
 * parte, na lista de campanhas. */
export function EmailComposer({ templates, audiences }: { templates: EmailTemplate[]; audiences: Audience[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function applyTemplate(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (template) setDraft((prev) => ({ ...prev, kind: template.kind, subject: template.subject, bodyHtml: template.bodyHtml }));
  }

  function submit(save: () => Promise<{ success: boolean; error?: string }>, doneMessage: string) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        const result = await save();
        if (!result.success) {
          setError(result.error ?? "Não foi possível salvar.");
          return;
        }
        setNotice(doneMessage);
        router.refresh();
      } catch {
        setError("Sem permissão ou falha de conexão. Tente de novo.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white/70 p-6">
      <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">Novo e-mail</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {templates.length > 0 && (
          <label className="sm:col-span-2">
            <span className={labelClass}>Começar de um template</span>
            <select className={inputClass} defaultValue="" onChange={(e) => applyTemplate(e.target.value)}>
              <option value="">Em branco</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({EMAIL_KIND_LABEL[template.kind]})
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          <span className={labelClass}>Nome interno *</span>
          <input className={inputClass} value={draft.name} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Tipo</span>
          <select className={inputClass} value={draft.kind} onChange={(e) => set("kind", e.target.value as EmailKind)}>
            {KIND_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className={labelClass}>Assunto *</span>
          <input className={inputClass} value={draft.subject} onChange={(e) => set("subject", e.target.value)} />
        </label>
        <label className="sm:col-span-2">
          <span className={labelClass}>Conteúdo (HTML) * — use {"{{nome}}"} para o nome da empresa</span>
          <textarea className={`${inputClass} font-mono text-[13px]`} rows={8} value={draft.bodyHtml} onChange={(e) => set("bodyHtml", e.target.value)} />
        </label>
        <label className="sm:col-span-2">
          <span className={labelClass}>Público (para criar a campanha)</span>
          <select className={inputClass} value={draft.audienceId} onChange={(e) => set("audienceId", e.target.value)}>
            <option value="">Escolha um público</option>
            {audiences.map((audience) => (
              <option key={audience.id} value={audience.id}>
                {audience.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-[13px] text-muted">
        Todo disparo leva automaticamente o rodapé com o link para cancelar a inscrição.
      </p>
      {error && <p className="text-[14px] text-danger">{error}</p>}
      {notice && <p className="text-[14px] text-success">{notice}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => submit(() => createCampaignAction(draft), "Campanha criada como rascunho.")}
          className="neu-primary rounded-full px-6 py-3 text-[15px] font-medium text-white disabled:opacity-60"
        >
          Criar campanha
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => submit(() => createTemplateAction(draft), "Template salvo.")}
          className="neu rounded-full px-6 py-3 text-[15px] font-medium text-foreground disabled:opacity-60"
        >
          Salvar como template
        </button>
      </div>
    </div>
  );
}
