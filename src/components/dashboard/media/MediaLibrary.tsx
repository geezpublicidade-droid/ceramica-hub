"use client";

import { useRef, useState, useTransition } from "react";
import { deleteMedia, uploadMedia } from "@/lib/actions/media-library";
import { assessImage, MEDIA_KIND_LABEL, type MediaKind } from "@/lib/media-fit";

export type MediaItem = { id: string; kind: MediaKind; name: string; url: string; width: number | null; height: number | null };

const KINDS = Object.keys(MEDIA_KIND_LABEL) as MediaKind[];

/** Biblioteca de mídias: envia, mostra o diagnóstico de tamanho de cada imagem e remove. */
export function MediaLibrary({ items }: { items: MediaItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [kind, setKind] = useState<MediaKind>("foto");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  function send(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    const body = new FormData();
    body.set("kind", kind);
    body.set("file", file);
    startTransition(async () => {
      const result = await uploadMedia(body).catch(() => ({ success: false as const, error: "Falha no envio." }));
      setMessage(result.success ? { ok: true, text: "Arquivo guardado na biblioteca." } : { ok: false, text: result.error });
      if (input.current) input.current.value = "";
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="glass-card-light rounded-2xl p-5">
        <h2 className="text-[16px] font-semibold text-foreground">Enviar arquivo</h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-[14px]">Tipo
            <select value={kind} onChange={(e) => setKind(e.target.value as MediaKind)} className="mt-1 block rounded-xl border border-border bg-white px-3 py-2.5 text-[15px]">
              {KINDS.map((value) => <option key={value} value={value}>{MEDIA_KIND_LABEL[value]}</option>)}
            </select>
          </label>
          <input ref={input} type="file" disabled={isPending} onChange={(e) => send(e.target.files?.[0])} className="text-[14px]" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,application/pdf" />
        </div>
        {isPending && <p className="mt-2 text-[13px] text-muted">Enviando…</p>}
        {message && <p className={`mt-2 text-[14px] ${message.ok ? "text-emerald-700" : "text-red-700"}`}>{message.text}</p>}
      </section>

      {KINDS.map((group) => {
        const list = items.filter((item) => item.kind === group);
        if (list.length === 0) return null;
        return (
          <section key={group}>
            <h2 className="text-[16px] font-semibold text-foreground">{MEDIA_KIND_LABEL[group]} ({list.length})</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {list.map((item) => {
                const verdict = item.width && item.height ? assessImage(item.width, item.height) : null;
                return (
                  <li key={item.id} className="flex gap-3 rounded-2xl border border-border bg-white/80 p-3">
                    {item.width ? (
                      // eslint-disable-next-line @next/next/no-img-element -- upload da empresa, domínio variável
                      <img src={item.url} alt={item.name} className="h-20 w-20 shrink-0 rounded-lg border border-border object-cover" />
                    ) : (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-border text-[12px] text-primary">Abrir</a>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-foreground">{item.name}</p>
                      {verdict && <p className={`text-[12px] ${verdict.tooSmall ? "text-red-700" : verdict.fits.length > 0 ? "text-emerald-700" : "text-muted"}`}>{verdict.message}</p>}
                      <button type="button" disabled={isPending} onClick={() => startTransition(() => void deleteMedia(item.id))} className="mt-1 text-[12px] font-medium text-red-700 underline disabled:opacity-60">Remover</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      {items.length === 0 && <p className="text-[15px] text-muted">Sua biblioteca está vazia. Envie logo, fotos, artes e documentos para tê-los sempre à mão.</p>}
    </div>
  );
}
