"use client";

import { useTransition } from "react";
import { cancelMyPublication } from "@/lib/actions/publications";
import { publicationStage } from "@/lib/ad-stage";
import { formatCents, formatDateBR } from "@/lib/utils";
import type { MyPublication } from "@/lib/services/publication-store";

const TONE_CLASS = {
  green: "bg-emerald-100 text-emerald-800",
  blue: "bg-sky-100 text-sky-800",
  yellow: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
  gray: "bg-stone-200 text-stone-700",
} as const;

export function MyPublicationsList({ publications }: { publications: MyPublication[] }) {
  const [isPending, startTransition] = useTransition();
  if (publications.length === 0) return null;
  return (
    <section className="glass-card-light rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-foreground">Minhas publicações</h2>
      <ul className="mt-4 divide-y divide-border">
        {publications.map((item) => {
          const stage = publicationStage(item);
          const cancellable = item.status === "aguardando" || item.status === "correcao";
          return (
            <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
              <div className="min-w-0">
                <p className="text-[16px] font-medium text-foreground">{item.title}</p>
                <p className="text-[14px] text-muted">
                  {item.productName} · {formatDateBR(item.scheduledFor)}{item.timeSlot && ` às ${item.timeSlot}`}
                  {item.paymentStatus === "incluido" ? " · incluído no plano" : item.priceCents > 0 ? ` · ${formatCents(item.priceCents)}` : ""}
                </p>
                {item.correctionNote && <p className="text-[14px] text-red-700">Ajuste pedido: {item.correctionNote}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-[13px] font-medium ${TONE_CLASS[stage.tone]}`}>{stage.label}</span>
                {cancellable && (
                  <button type="button" disabled={isPending} onClick={() => startTransition(() => void cancelMyPublication(item.id))} className="text-[13px] font-medium text-red-700 underline disabled:opacity-60">
                    Cancelar
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
