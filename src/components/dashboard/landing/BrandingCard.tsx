"use client";

import { useState } from "react";
import { saveBranding } from "@/lib/actions/landing-editor";
import { Field, SaveBar, UpgradeNote, ghostButtonClass, inputClass, useSaver } from "./ui";
import { UploadButton } from "./UploadButton";
import type { TabProps } from "./types";

/** Identidade da empresa: logo, capa, descrição, Instagram e site. A empresa e o admin editam, com envio de arquivo. */
export function BrandingCard({ data, target }: TabProps) {
  const { business, capabilities } = data;
  const [form, setForm] = useState({
    logoUrl: business.logo ?? "",
    coverPhotoUrl: business.coverPhoto ?? "",
    description: business.description ?? "",
    instagram: business.instagram ?? "",
    websiteUrl: business.websiteUrl ?? "",
  });
  const { pending, message, run } = useSaver();
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <section className="rounded-lg border border-border bg-white p-5">
      <h3 className="text-[16px] font-semibold">Identidade da empresa</h3>
      <p className="mt-1 text-[13.5px] text-muted">Aparece na página, no diretório, nas categorias e nos compartilhamentos.</p>

      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <div>
          <p className="text-[14px] font-medium">Logo (quadrada, fundo transparente ou branco)</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {form.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.logoUrl} alt="" className="h-16 w-16 rounded-md border border-border bg-white object-contain" />
            )}
            <UploadButton target={target} label={form.logoUrl ? "Trocar logo" : "Enviar logo"} onUploaded={(url) => set("logoUrl", url)} />
            {form.logoUrl && (
              <button type="button" onClick={() => set("logoUrl", "")} className={ghostButtonClass}>
                Remover
              </button>
            )}
          </div>
        </div>
        <div>
          <p className="text-[14px] font-medium">Capa da empresa</p>
          {capabilities.customCover ? (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {form.coverPhotoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.coverPhotoUrl} alt="" className="h-16 w-28 rounded-md object-cover" />
              )}
              <UploadButton target={target} label={form.coverPhotoUrl ? "Trocar capa" : "Enviar capa"} onUploaded={(url) => set("coverPhotoUrl", url)} />
              {form.coverPhotoUrl && (
                <button type="button" onClick={() => set("coverPhotoUrl", "")} className={ghostButtonClass}>
                  Remover
                </button>
              )}
            </div>
          ) : (
            <div className="mt-2">
              <UpgradeNote>A capa personalizada faz parte do plano Profissional ou superior.</UpgradeNote>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <Field label="Descrição da empresa" hint={`${form.description.length}/600 — usada como texto do hero quando você não escreve outro.`}>
          <textarea rows={3} maxLength={600} value={form.description} onChange={(e) => set("description", e.target.value)} className={inputClass} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Instagram" hint="@usuario">
            <input maxLength={60} value={form.instagram} onChange={(e) => set("instagram", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Site" hint="Link completo com https://">
            <input value={form.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} className={inputClass} />
          </Field>
        </div>
      </div>
      <SaveBar
        pending={pending}
        message={message}
        label="Salvar identidade"
        onSave={() =>
          run(() =>
            saveBranding(target, {
              logoUrl: form.logoUrl,
              coverPhotoUrl: capabilities.customCover ? form.coverPhotoUrl : undefined,
              description: form.description,
              instagram: form.instagram,
              websiteUrl: form.websiteUrl,
            }),
          )
        }
      />
    </section>
  );
}
