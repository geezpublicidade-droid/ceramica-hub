"use client";

import { useState } from "react";
import Link from "next/link";
import { saveLandingConfig } from "@/lib/actions/landing-editor";
import { Field, SaveBar, TabIntro, UpgradeNote, ghostButtonClass, inputClass, useSaver } from "../ui";
import { UploadButton } from "../UploadButton";
import type { TabProps } from "../types";

const CTA_KINDS = [
  { value: "servicos", label: "Conhecer serviços" },
  { value: "orcamento", label: "Solicitar orçamento" },
  { value: "agendar", label: "Agendar horário" },
  { value: "cardapio", label: "Ver cardápio" },
] as const;

/** Hero: título, texto de apresentação, botão secundário e imagem de capa. Logo e capa básica ficam em "Editar página". */
export function HeroTab({ data, target }: TabProps) {
  const { config, capabilities } = data;
  const [form, setForm] = useState({
    heroHeadline: config.heroHeadline ?? "",
    heroSubtitle: config.heroSubtitle ?? "",
    heroCtaKind: config.heroCtaKind,
    heroCtaLabel: config.heroCtaLabel ?? "",
    heroImageUrl: config.heroImageUrl ?? "",
  });
  const { pending, message, run } = useSaver();
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="space-y-4">
      <TabIntro>O topo da página: a proposta de valor e o botão que leva à conversão. A logo e a foto de capa da empresa são editadas em &quot;Editar página&quot;.</TabIntro>
      <Field label="Título principal" hint="Proposta de valor em uma frase (até 120 caracteres).">
        <input maxLength={120} value={form.heroHeadline} onChange={(e) => set("heroHeadline", e.target.value)} className={inputClass} />
      </Field>
      <Field label="Texto de apresentação" hint="Se ficar vazio, usa a descrição da empresa.">
        <textarea rows={3} maxLength={280} value={form.heroSubtitle} onChange={(e) => set("heroSubtitle", e.target.value)} className={inputClass} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Botão secundário">
          <select value={form.heroCtaKind} onChange={(e) => set("heroCtaKind", e.target.value as typeof form.heroCtaKind)} className={inputClass}>
            {CTA_KINDS.map((kind) => (
              <option key={kind.value} value={kind.value}>
                {kind.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Texto do botão (opcional)" hint="Vazio usa o texto padrão da opção.">
          <input maxLength={30} value={form.heroCtaLabel} onChange={(e) => set("heroCtaLabel", e.target.value)} className={inputClass} />
        </Field>
      </div>

      <div>
        <p className="text-[14px] font-medium">Imagem do hero</p>
        {capabilities.customCover ? (
          <div className="mt-2 flex flex-wrap items-center gap-4">
            {form.heroImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.heroImageUrl} alt="" className="h-24 w-40 rounded-lg object-cover" />
            )}
            <UploadButton target={target} label={form.heroImageUrl ? "Trocar imagem" : "Enviar imagem"} onUploaded={(url) => set("heroImageUrl", url)} />
            {form.heroImageUrl && (
              <button type="button" onClick={() => set("heroImageUrl", "")} className={ghostButtonClass}>
                Usar a capa da empresa
              </button>
            )}
          </div>
        ) : (
          <div className="mt-2">
            <UpgradeNote>A imagem de capa personalizada faz parte do plano Profissional ou superior.</UpgradeNote>
          </div>
        )}
        <p className="mt-2 text-[12.5px] text-muted">
          Recomendado: foto horizontal, ao menos 1600 px de largura.{" "}
          <Link href="/dashboard/editar" className="font-medium text-primary hover:underline">
            Editar logo e capa básica
          </Link>
        </p>
      </div>
      <SaveBar pending={pending} message={message} onSave={() => run(() => saveLandingConfig(target, form))} />
    </div>
  );
}
