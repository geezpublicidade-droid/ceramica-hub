"use client";

import { useState } from "react";
import { saveLandingConfig } from "@/lib/actions/landing-editor";
import { Field, SaveBar, TabIntro, inputClass, useSaver } from "../ui";
import type { TabProps } from "../types";

/** SEO: título e descrição que aparecem no Google e ao compartilhar o link. */
export function SeoTab({ data, target }: TabProps) {
  const [title, setTitle] = useState(data.config.seoTitle ?? "");
  const [description, setDescription] = useState(data.config.seoDescription ?? "");
  const { pending, message, run } = useSaver();

  return (
    <div className="space-y-4">
      <TabIntro>Vazio usa o padrão do Hub (nome da empresa + Cerâmica Hub). Só vale com a página publicada.</TabIntro>
      <Field label="Título da página" hint={`${title.length}/70 — ideal até 60 caracteres.`}>
        <input maxLength={70} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Descrição" hint={`${description.length}/160 — aparece abaixo do título no Google.`}>
        <textarea rows={3} maxLength={160} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
      </Field>
      <div className="rounded-lg border border-border bg-white p-4">
        <p className="text-[13px] text-muted">Prévia no Google</p>
        <p className="mt-1 text-[18px] text-[#1a0dab]">{title || `${data.business.name} — Cerâmica Hub`}</p>
        <p className="text-[13px] text-whatsapp">ceramicahub.com.br/empresa/{data.business.slug}</p>
        <p className="mt-0.5 text-[14px] text-foreground/75">{description || data.business.description}</p>
      </div>
      <SaveBar pending={pending} message={message} onSave={() => run(() => saveLandingConfig(target, { seoTitle: title, seoDescription: description }))} />
    </div>
  );
}
