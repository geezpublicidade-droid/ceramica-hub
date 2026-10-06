"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export const inputClass = "mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";
export const buttonClass = "tap rounded-full bg-primary px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50";
export const ghostButtonClass = "tap rounded-full border border-border px-4 py-2 text-[14px] font-medium text-foreground transition hover:bg-black/5 disabled:opacity-50";

type ActionResult = { success: true } | { success: false; error: string };

/** Executa uma ação do servidor com estado de envio e mensagem de resultado; em caso de sucesso atualiza a tela. */
export function useSaver() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function run(action: () => Promise<ActionResult>, okText = "Salvo.") {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      setMessage(result.success ? { ok: true, text: okText } : { ok: false, text: result.error });
      if (result.success) router.refresh();
    });
  }
  return { pending, message, run };
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-[14px] font-medium text-foreground">
      {label}
      {children}
      {hint && <span className="mt-1 block text-[12.5px] font-normal text-muted">{hint}</span>}
    </label>
  );
}

export function SaveBar({ pending, message, onSave, label = "Salvar" }: { pending: boolean; message: { ok: boolean; text: string } | null; onSave: () => void; label?: string }) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-4">
      <button type="button" onClick={onSave} disabled={pending} className={buttonClass}>
        {pending ? "Salvando…" : label}
      </button>
      {message && (
        <p role="status" className={`text-[14px] font-medium ${message.ok ? "text-whatsapp" : "text-red-700"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}

export function UpgradeNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg bg-primary/5 px-4 py-3 text-[14px] text-foreground">
      <p className="font-medium">Recurso de um plano superior</p>
      <p className="mt-0.5 text-muted">{children}</p>
      <Link href="/planos" className="tap mt-1.5 inline-block font-medium text-primary hover:underline">
        Conhecer os planos →
      </Link>
    </div>
  );
}

export function TabIntro({ children }: { children: ReactNode }) {
  return <p className="mb-5 max-w-2xl text-[14.5px] leading-relaxed text-muted">{children}</p>;
}

/** Move um item para cima/baixo e devolve a nova ordem de ids. */
export function moveId(ids: string[], id: string, delta: -1 | 1): string[] {
  const index = ids.indexOf(id);
  const target = index + delta;
  if (index < 0 || target < 0 || target >= ids.length) return ids;
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
