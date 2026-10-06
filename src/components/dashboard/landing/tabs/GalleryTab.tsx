"use client";

import { useState } from "react";
import type { OwnedPhoto } from "@/lib/services/platform";
import { addMedia, deleteMedia, reorderMedia, updateMediaDetails } from "@/lib/actions/landing-editor";
import { UploadButton } from "../UploadButton";
import { Field, TabIntro, UpgradeNote, buttonClass, ghostButtonClass, inputClass, moveId, useSaver } from "../ui";
import type { TabProps } from "../types";

function MediaRow({ item, ids, target }: { item: OwnedPhoto; ids: string[]; target?: string }) {
  const [caption, setCaption] = useState(item.caption ?? "");
  const [alt, setAlt] = useState(item.alt ?? "");
  const { pending, message, run } = useSaver();

  return (
    <li className="flex flex-wrap gap-4 rounded-lg border border-border bg-white p-4">
      {item.kind === "video" ? (
        <video src={item.url} className="h-24 w-36 rounded-md object-cover" muted preload="metadata" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.url} alt={item.alt ?? ""} className="h-24 w-36 rounded-md object-cover" />
      )}
      <div className="min-w-56 flex-1 space-y-3">
        <Field label="Legenda (opcional)">
          <input maxLength={160} value={caption} onChange={(e) => setCaption(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Texto alternativo" hint="Descreve a imagem para leitores de tela e para o Google.">
          <input maxLength={160} value={alt} onChange={(e) => setAlt(e.target.value)} className={inputClass} />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" disabled={pending} onClick={() => run(() => updateMediaDetails(target, { id: item.id, caption: caption || null, alt: alt || null }))} className={buttonClass}>
            Salvar
          </button>
          <button type="button" aria-label="Subir" disabled={pending} onClick={() => run(() => reorderMedia(target, moveId(ids, item.id, -1)), "Ordem atualizada.")} className={ghostButtonClass}>
            ↑
          </button>
          <button type="button" aria-label="Descer" disabled={pending} onClick={() => run(() => reorderMedia(target, moveId(ids, item.id, 1)), "Ordem atualizada.")} className={ghostButtonClass}>
            ↓
          </button>
          <button type="button" disabled={pending} onClick={() => run(() => deleteMedia(target, item.id), "Removido.")} className="tap text-[14px] font-medium text-red-700 hover:underline">
            Remover
          </button>
          {message && <span className={`text-[13.5px] font-medium ${message.ok ? "text-whatsapp" : "text-red-700"}`}>{message.text}</span>}
        </div>
      </div>
    </li>
  );
}

/** Galeria: fotos (todos os planos com galeria) e vídeos (planos com vídeo). Abrem em lightbox na página. */
export function GalleryTab({ data, target }: TabProps) {
  const { capabilities, media } = data;
  const { pending, message, run } = useSaver();
  const ids = media.map((item) => item.id);

  if (!capabilities.gallery) return <UpgradeNote>A galeria de fotos faz parte do plano Profissional ou superior.</UpgradeNote>;

  return (
    <div className="space-y-5">
      <TabIntro>
        Mostre o ambiente, a equipe e os produtos. Seu plano permite até {capabilities.maxGalleryItems} itens ({media.length} em uso).{" "}
        {capabilities.virtualTour ? "O tour 3D (editado em \"Editar página\") aparece como um bloco da galeria." : "O tour 3D é exclusivo do plano Premium."}
      </TabIntro>
      <ul className="space-y-3">
        {media.map((item) => (
          <MediaRow key={`${item.id}-${item.caption}-${item.alt}`} item={item} ids={ids} target={target} />
        ))}
      </ul>
      <div className="flex flex-wrap items-start gap-4 rounded-lg border border-dashed border-border p-4">
        <UploadButton target={target} label="Adicionar foto" onUploaded={(url) => run(() => addMedia(target, url, "photo"), "Foto adicionada.")} />
        {capabilities.video ? (
          <UploadButton target={target} kind="video" label="Adicionar vídeo" onUploaded={(url) => run(() => addMedia(target, url, "video"), "Vídeo adicionado.")} />
        ) : (
          <p className="text-[13px] text-muted">Vídeos fazem parte do plano Experiência ou superior.</p>
        )}
        {pending && <span className="text-[14px] text-muted">Salvando…</span>}
        {message && <span className={`text-[14px] font-medium ${message.ok ? "text-whatsapp" : "text-red-700"}`}>{message.text}</span>}
      </div>
    </div>
  );
}
