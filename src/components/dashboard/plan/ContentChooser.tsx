"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setContentActive } from "@/lib/actions/plan-content";

export type ChooserItem = { id: string; label: string; active: boolean };
export type ChooserGroup = { kind: "service" | "photo" | "video" | "promotion"; title: string; limit: number; items: ChooserItem[] };

/**
 * “O que fica publicado”: depois de um downgrade (ou a qualquer momento) a empresa escolhe quais itens ficam no ar dentro do
 * limite do plano. Itens desativados continuam salvos e voltam quando o plano permitir. Só aparece se houver o que escolher.
 */
export function ContentChooser({ groups }: { groups: ChooserGroup[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const relevant = groups.filter((group) => group.items.length > 0 && (group.items.length > group.limit || group.items.some((item) => !item.active)));
  if (relevant.length === 0) return null;

  function toggle(group: ChooserGroup, item: ChooserItem) {
    setMessage(null);
    startTransition(async () => {
      const result = await setContentActive({ kind: group.kind, id: item.id, active: !item.active });
      if (!result.success) setMessage(result.error);
      else router.refresh();
    });
  }

  return (
    <section className="glass-light rounded-3xl p-6">
      <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-muted">O que fica publicado</p>
      <p className="mt-1 text-[14px] text-muted">Seu plano publica uma quantidade limitada de cada tipo. Ative os itens que quer no ar; os demais continuam salvos.</p>
      {message && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[13.5px] font-medium text-red-800">{message}</p>}
      <div className="mt-4 space-y-5">
        {relevant.map((group) => {
          const published = group.items.filter((item) => item.active).length;
          return (
            <div key={group.kind}>
              <p className="text-[14.5px] font-semibold">
                {group.title}{" "}
                <span className="font-normal text-muted">
                  — {published} publicado{published === 1 ? "" : "s"}
                  {Number.isFinite(group.limit) ? ` (limite ${group.limit})` : ""}
                </span>
              </p>
              <ul className="mt-2 divide-y divide-border rounded-xl border border-border bg-white">
                {group.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[14.5px]">
                    <span className={item.active ? "" : "text-muted"}>{item.label}</span>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => toggle(group, item)}
                      aria-pressed={item.active}
                      className={`tap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition disabled:opacity-50 ${item.active ? "bg-whatsapp/10 text-whatsapp" : "border border-border text-foreground hover:bg-black/5"}`}
                    >
                      {item.active ? "No ar" : "Salvo (oculto)"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
