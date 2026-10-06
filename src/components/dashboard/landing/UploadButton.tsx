"use client";

import { useRef, useState } from "react";
import { uploadLandingAsset } from "@/lib/actions/landing-editor";
import { ghostButtonClass } from "./ui";

type UploadButtonProps = {
  target?: string;
  kind?: "image" | "video";
  label: string;
  onUploaded: (url: string) => void;
};

/** Escolhe um arquivo, envia ao armazenamento da empresa e devolve a URL pública. */
export function UploadButton({ target, kind = "image", label, onUploaded }: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<{ busy: boolean; error: string | null }>({ busy: false, error: null });

  async function onChange(file: File | undefined) {
    if (!file) return;
    setState({ busy: true, error: null });
    const body = new FormData();
    body.set("file", file);
    body.set("kind", kind);
    const result = await uploadLandingAsset(target, body).catch(() => ({ success: false as const, error: "Falha no envio." }));
    if (inputRef.current) inputRef.current.value = "";
    if (result.success) {
      onUploaded(result.url);
      setState({ busy: false, error: null });
    } else {
      setState({ busy: false, error: result.error });
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <input ref={inputRef} type="file" accept={kind === "video" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/avif"} hidden onChange={(e) => void onChange(e.target.files?.[0])} />
      <button type="button" disabled={state.busy} onClick={() => inputRef.current?.click()} className={ghostButtonClass}>
        {state.busy ? "Enviando…" : label}
      </button>
      {state.error && <span className="text-[13px] text-red-700">{state.error}</span>}
    </div>
  );
}
