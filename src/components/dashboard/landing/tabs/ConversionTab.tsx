"use client";

import { useState } from "react";
import { saveLandingConfig } from "@/lib/actions/landing-editor";
import { resolveSectionOrder, SECTION_KEYS, type SectionKey } from "@/lib/landing/sections";
import { Field, SaveBar, TabIntro, UpgradeNote, ghostButtonClass, inputClass, moveId, useSaver } from "../ui";
import type { TabProps } from "../types";

const SECTION_LABELS: Record<SectionKey, string> = {
  about: "Apresentação",
  services: "Serviços",
  offer: "Oferta exclusiva",
  gallery: "Galeria",
  reviews: "Avaliações",
  location: "Localização e contato",
  faq: "Perguntas frequentes",
  cta: "Chamada final e formulário",
};

/** Botões e conversão: WhatsApp, formulário, chamada final e a ordem/visibilidade das seções. */
export function ConversionTab({ data, target }: TabProps) {
  const { config, capabilities } = data;
  const [form, setForm] = useState({
    whatsappPhone: config.whatsappPhone ?? "",
    whatsappMessage: config.whatsappMessage ?? "",
    leadFormEnabled: config.leadFormEnabled,
    finalCtaTitle: config.finalCtaTitle ?? "",
    finalCtaText: config.finalCtaText ?? "",
    finalCtaLabel: config.finalCtaLabel ?? "",
  });
  const [order, setOrder] = useState<string[]>(() => [...SECTION_KEYS].sort((a, b) => indexOf(config.sectionOrder, a) - indexOf(config.sectionOrder, b)));
  const [disabled, setDisabled] = useState<string[]>(config.sectionsDisabled);
  const { pending, message, run } = useSaver();

  function save() {
    run(() =>
      saveLandingConfig(target, {
        ...form,
        sectionOrder: resolveSectionOrder(order, []),
        sectionsDisabled: SECTION_KEYS.filter((key) => disabled.includes(key)),
      }),
    );
  }

  return (
    <div className="space-y-6">
      <TabIntro>Define como o visitante entra em contato e em que ordem as seções aparecem na página.</TabIntro>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="WhatsApp da página" hint="Vazio usa o telefone do cadastro.">
          <input type="tel" value={form.whatsappPhone} onChange={(e) => setForm({ ...form, whatsappPhone: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Mensagem automática do WhatsApp" hint="Vazio usa a mensagem padrão do Hub.">
          <input maxLength={300} value={form.whatsappMessage} onChange={(e) => setForm({ ...form, whatsappMessage: e.target.value })} className={inputClass} />
        </Field>
      </div>

      <div className="rounded-lg border border-border bg-white p-4">
        {capabilities.leadForm ? (
          <label className="flex items-start gap-2.5 text-[14px] font-medium">
            <input type="checkbox" checked={form.leadFormEnabled} onChange={(e) => setForm({ ...form, leadFormEnabled: e.target.checked })} className="mt-0.5 h-4 w-4 accent-[var(--primary)]" />
            <span>
              Ativar formulário de pedido de contato
              <span className="mt-0.5 block text-[12.5px] font-normal text-muted">Os pedidos chegam em &quot;Leads&quot; com o consentimento LGPD registrado.</span>
            </span>
          </label>
        ) : (
          <UpgradeNote>O formulário de contato faz parte do plano Destaque ou superior.</UpgradeNote>
        )}
      </div>

      <div className="grid gap-4">
        <Field label="Título da chamada final">
          <input maxLength={120} value={form.finalCtaTitle} onChange={(e) => setForm({ ...form, finalCtaTitle: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Texto da chamada final">
          <textarea rows={2} maxLength={280} value={form.finalCtaText} onChange={(e) => setForm({ ...form, finalCtaText: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Texto do botão final">
          <input maxLength={30} value={form.finalCtaLabel} onChange={(e) => setForm({ ...form, finalCtaLabel: e.target.value })} className={inputClass} />
        </Field>
      </div>

      <fieldset>
        <legend className="text-[14px] font-medium">Ordem e visibilidade das seções</legend>
        <ul className="mt-2 divide-y divide-border rounded-lg border border-border bg-white">
          {order.map((key) => (
            <li key={key} className="flex items-center gap-3 px-3.5 py-2.5">
              <input
                type="checkbox"
                aria-label={`Mostrar ${SECTION_LABELS[key as SectionKey]}`}
                checked={!disabled.includes(key)}
                onChange={(e) => setDisabled((current) => (e.target.checked ? current.filter((k) => k !== key) : [...current, key]))}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              <span className={`flex-1 text-[14px] ${disabled.includes(key) ? "text-muted line-through" : ""}`}>{SECTION_LABELS[key as SectionKey]}</span>
              <button type="button" aria-label="Subir" onClick={() => setOrder((current) => moveId(current, key, -1))} className={ghostButtonClass}>
                ↑
              </button>
              <button type="button" aria-label="Descer" onClick={() => setOrder((current) => moveId(current, key, 1))} className={ghostButtonClass}>
                ↓
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-[12.5px] text-muted">Seções sem conteúdo (por exemplo, sem oferta ativa) não aparecem, mesmo marcadas.</p>
      </fieldset>
      <SaveBar pending={pending} message={message} onSave={save} />
    </div>
  );
}

function indexOf(order: string[], key: string): number {
  const index = order.indexOf(key);
  return index === -1 ? order.length + SECTION_KEYS.indexOf(key as SectionKey) : index;
}
