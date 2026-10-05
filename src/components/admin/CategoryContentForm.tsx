"use client";

import { useState, useTransition } from "react";
import { updateCategoryContentAction } from "@/lib/actions/admin-category-content";
import type { CategoryContent } from "@/lib/category-content";
import type { AdminCategoryContent } from "@/lib/services/category-content-admin";

const inputClass = "mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-[14px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[13px] font-medium text-foreground";

type TextField = { key: keyof CategoryContent; label: string; placeholder: string; multiline?: boolean };

const SECTIONS: { title: string; fields: TextField[] }[] = [
  {
    title: "Hero",
    fields: [
      { key: "heroTitle", label: "Título", placeholder: "Vazio = “{categoria} no Espaço Cerâmica”" },
      { key: "heroDescription", label: "Descrição", placeholder: "Vazio = descrição da categoria", multiline: true },
      { key: "heroHelper", label: "Texto auxiliar (abaixo da busca)", placeholder: "Opcional" },
      { key: "heroImageUrl", label: "Imagem desktop", placeholder: "https://… ou /images/…  (vazio = herda da categoria-mãe)" },
      { key: "heroImageMobileUrl", label: "Imagem celular", placeholder: "Vazio = a mesma do desktop" },
      { key: "heroImageAlt", label: "Texto alternativo da imagem", placeholder: "Descreva a foto" },
    ],
  },
  {
    title: "Carrossel patrocinado",
    fields: [{ key: "highlightsText", label: "Texto abaixo de “Destaques em …”", placeholder: "Vazio = texto padrão" }],
  },
  {
    title: "Painel comercial (ao lado do hero)",
    fields: [
      { key: "adEyebrow", label: "Chamada curta", placeholder: "Anuncie nesta categoria" },
      { key: "adText", label: "Texto", placeholder: "Conecte sua marca a quem vive, trabalha e circula pelo Cerâmica.", multiline: true },
      { key: "adCtaLabel", label: "Texto do botão", placeholder: "Quero anunciar" },
      { key: "adCtaUrl", label: "Link do botão", placeholder: "Vazio = página de planos desta categoria" },
    ],
  },
  {
    title: "SEO",
    fields: [{ key: "seoText", label: "Texto institucional no fim da página (parágrafos separados por linha em branco)", placeholder: "Aparece só nesta categoria, não é herdado", multiline: true }],
  },
];

type FormState = Record<Exclude<keyof CategoryContent, "adEnabled">, string> & { adEnabled: boolean };

function toForm(content: CategoryContent): FormState {
  return {
    heroTitle: content.heroTitle ?? "",
    heroDescription: content.heroDescription ?? "",
    heroHelper: content.heroHelper ?? "",
    heroImageUrl: content.heroImageUrl ?? "",
    heroImageMobileUrl: content.heroImageMobileUrl ?? "",
    heroImageAlt: content.heroImageAlt ?? "",
    highlightsText: content.highlightsText ?? "",
    seoText: content.seoText ?? "",
    adEnabled: content.adEnabled,
    adEyebrow: content.adEyebrow ?? "",
    adText: content.adText ?? "",
    adCtaLabel: content.adCtaLabel ?? "",
    adCtaUrl: content.adCtaUrl ?? "",
  };
}

/** Editor do conteúdo da vitrine de uma categoria; campo vazio volta ao padrão (ou herda da categoria-mãe). */
export function CategoryContentForm({ category }: { category: AdminCategoryContent }) {
  const [form, setForm] = useState<FormState>(() => toForm(category.content));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await updateCategoryContentAction(category.id, form);
        setMessage(result.success ? { ok: true, text: "Salvo." } : { ok: false, text: result.error });
      } catch {
        setMessage({ ok: false, text: "Não foi possível salvar agora. Tente de novo." });
      }
    });
  }

  return (
    <details className="rounded-2xl border border-border bg-white/70 px-5 py-4">
      <summary className="flex cursor-pointer items-center justify-between gap-3 text-[16px] font-medium text-foreground">
        <span className={category.level === 2 ? "pl-4 text-[15px]" : ""}>{category.label}</span>
        <span className="text-[12px] font-normal text-muted">/categoria/{category.slug}</span>
      </summary>
      <div className="mt-4 flex flex-col gap-5">
        {SECTIONS.map((section) => (
          <fieldset key={section.title} className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-muted">{section.title}</legend>
            {section.title.startsWith("Painel") && (
              <label className="flex items-center gap-2 text-[14px] sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.adEnabled}
                  onChange={(e) => setForm((prev) => ({ ...prev, adEnabled: e.target.checked }))}
                />
                Mostrar o painel comercial
              </label>
            )}
            {section.fields.map(({ key, label, placeholder, multiline }) => (
              <label key={key} className={multiline ? "sm:col-span-2" : ""}>
                <span className={labelClass}>{label}</span>
                {multiline ? (
                  <textarea
                    rows={key === "seoText" ? 6 : 2}
                    className={inputClass}
                    value={form[key] as string}
                    placeholder={placeholder}
                    onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                ) : (
                  <input
                    className={inputClass}
                    value={form[key] as string}
                    placeholder={placeholder}
                    onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                )}
              </label>
            ))}
          </fieldset>
        ))}
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={save}
            className="neu-primary rounded-full px-6 py-2 text-[14px] font-medium text-white disabled:opacity-50"
          >
            {isPending ? "Salvando…" : "Salvar"}
          </button>
          {message && <p className={`text-[13px] ${message.ok ? "text-emerald-700" : "text-red-700"}`}>{message.text}</p>}
        </div>
      </div>
    </details>
  );
}
