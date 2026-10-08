"use client";

import { useRef, useState, type ReactNode } from "react";
import { uploadRegistrationImage } from "@/lib/actions/register-business";

export const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[17px] text-foreground outline-none focus:border-primary";
export const labelClass = "text-[15px] font-medium text-foreground";
export const smallButtonClass =
  "tap rounded-full border border-border px-4 py-2 text-[14px] font-medium text-foreground transition hover:bg-black/5 disabled:opacity-50";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[13px] text-muted">{hint}</span>}
    </label>
  );
}

export function StepHeader({ eyebrow, title, hint }: { eyebrow: string; title: string; hint?: string }) {
  return (
    <div>
      <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">{eyebrow}</p>
      <h2 className="mt-1 text-[1.3rem] font-semibold text-foreground">{title}</h2>
      {hint && <p className="mt-1.5 text-[15px] text-muted">{hint}</p>}
    </div>
  );
}

/** Selo "veio do Google, confira" ao lado de campos que a importação preencheu. */
export function ImportedBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[12px] font-medium text-primary">do Google</span>;
}

type ImageUploadProps = { label: string; value: string; onChange: (url: string) => void; round?: boolean };

/** Envia uma imagem para o armazenamento e devolve a URL; mostra a prévia e permite remover. */
export function ImageUpload({ label, value, onChange, round }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<{ busy: boolean; error: string | null }>({ busy: false, error: null });

  async function send(file: File | undefined) {
    if (!file) return;
    setState({ busy: true, error: null });
    const body = new FormData();
    body.set("file", file);
    const result = await uploadRegistrationImage(body).catch(() => ({ success: false as const, error: "Falha no envio." }));
    if (inputRef.current) inputRef.current.value = "";
    if (result.success) onChange(result.url);
    setState({ busy: false, error: result.success ? null : result.error });
  }

  return (
    <div>
      <span className={labelClass}>{label}</span>
      <div className="mt-1.5 flex items-center gap-3">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className={`h-16 w-16 border border-border object-cover ${round ? "rounded-full" : "rounded-xl"}`} />
        )}
        <input ref={inputRef} type="file" hidden accept="image/jpeg,image/png,image/webp,image/avif" onChange={(e) => void send(e.target.files?.[0])} />
        <button type="button" disabled={state.busy} onClick={() => inputRef.current?.click()} className={smallButtonClass}>
          {state.busy ? "Enviando…" : value ? "Trocar" : "Enviar imagem"}
        </button>
        {value && (
          <button type="button" onClick={() => onChange("")} className="text-[14px] text-muted underline">
            Remover
          </button>
        )}
      </div>
      {state.error && <p className="mt-1 text-[13px] text-red-600">{state.error}</p>}
    </div>
  );
}
