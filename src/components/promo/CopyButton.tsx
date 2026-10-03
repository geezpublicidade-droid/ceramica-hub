"use client";

import { useState } from "react";

/** Copia um texto (link rastreado) e confirma no próprio botão. */
export function CopyButton({ text, label, copiedLabel }: { text: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // sem permissão de área de transferência: seleciona o campo para copiar na mão
      window.prompt(label, text);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="neu inline-flex min-h-10 shrink-0 items-center rounded-full px-4 text-[14px] font-medium text-foreground"
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
