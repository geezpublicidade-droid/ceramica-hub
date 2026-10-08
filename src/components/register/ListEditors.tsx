"use client";

import type { DraftFaq, DraftService } from "@/lib/profile/draft";
import { MAX_DRAFT_FAQS, MAX_DRAFT_SERVICES } from "@/lib/profile/draft";
import { inputClass, smallButtonClass } from "./wizard-ui";

type ListProps<T> = { items: T[]; onChange: (next: T[]) => void };

function replaceAt<T>(items: T[], index: number, patch: Partial<T>): T[] {
  return items.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

const without = <T,>(items: T[], index: number): T[] => items.filter((_, i) => i !== index);

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-[14px] text-muted underline">
      Remover
    </button>
  );
}

export function ServicesEditor({ items, onChange }: ListProps<DraftService>) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((service, index) => (
        <div key={index} className="rounded-2xl border border-border bg-white p-4">
          <input className={inputClass} placeholder="Nome do serviço ou produto" value={service.name} maxLength={120} onChange={(e) => onChange(replaceAt(items, index, { name: e.target.value }))} />
          <textarea className={inputClass} rows={2} placeholder="Descrição curta (opcional)" value={service.description} maxLength={400} onChange={(e) => onChange(replaceAt(items, index, { description: e.target.value }))} />
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <input className={`${inputClass} w-40`} placeholder="A partir de R$" inputMode="decimal" value={service.price} onChange={(e) => onChange(replaceAt(items, index, { price: e.target.value }))} />
            <RemoveButton onClick={() => onChange(without(items, index))} />
          </div>
        </div>
      ))}
      {items.length < MAX_DRAFT_SERVICES && (
        <button type="button" onClick={() => onChange([...items, { name: "", description: "", price: "" }])} className={`${smallButtonClass} self-start`}>
          + Adicionar serviço
        </button>
      )}
    </div>
  );
}

export function FaqEditor({ items, onChange }: ListProps<DraftFaq>) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((faq, index) => (
        <div key={index} className="rounded-2xl border border-border bg-white p-4">
          <input className={inputClass} placeholder="Pergunta (ex.: Aceitam convênio?)" value={faq.question} maxLength={160} onChange={(e) => onChange(replaceAt(items, index, { question: e.target.value }))} />
          <textarea className={inputClass} rows={2} placeholder="Resposta" value={faq.answer} maxLength={800} onChange={(e) => onChange(replaceAt(items, index, { answer: e.target.value }))} />
          <div className="mt-1 text-right">
            <RemoveButton onClick={() => onChange(without(items, index))} />
          </div>
        </div>
      ))}
      {items.length < MAX_DRAFT_FAQS && (
        <button type="button" onClick={() => onChange([...items, { question: "", answer: "" }])} className={`${smallButtonClass} self-start`}>
          + Adicionar pergunta
        </button>
      )}
    </div>
  );
}

/** Lista de frases curtas (diferenciais): um campo por linha, máximo `max`. */
export function ShortListEditor({ items, onChange, max, placeholder }: ListProps<string> & { max: number; placeholder: string }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((text, index) => (
        <div key={index} className="flex items-center gap-3">
          <input className={`${inputClass} mt-0`} placeholder={placeholder} value={text} maxLength={80} onChange={(e) => onChange(items.map((t, i) => (i === index ? e.target.value : t)))} />
          <RemoveButton onClick={() => onChange(without(items, index))} />
        </div>
      ))}
      {items.length < max && (
        <button type="button" onClick={() => onChange([...items, ""])} className={`${smallButtonClass} self-start`}>
          + Adicionar
        </button>
      )}
    </div>
  );
}

/** Galeria de fotos já enviadas, com remoção. */
export function PhotoStrip({ urls, onChange }: { urls: string[]; onChange: (next: string[]) => void }) {
  if (!urls.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-3">
      {urls.map((url, index) => (
        <div key={url} className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="h-20 w-20 rounded-xl border border-border object-cover" />
          <button type="button" aria-label="Remover foto" onClick={() => onChange(without(urls, index))} className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-foreground text-[13px] text-white">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
