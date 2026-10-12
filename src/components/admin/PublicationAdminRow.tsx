"use client";

import { useState, useTransition } from "react";
import {
  approvePublication,
  confirmPublicationPayment,
  markPublicationPublished,
  requestPublicationCorrection,
} from "@/lib/actions/admin-publications";
import { formatCents, formatDateBR } from "@/lib/utils";

export type AdminPublication = {
  id: string;
  businessName: string;
  productName: string;
  title: string;
  body: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  scheduledFor: string;
  timeSlot: string;
  status: string;
  paymentStatus: string;
  priceCents: number;
  correctionNote: string | null;
};

const STATUS_LABEL: Record<string, string> = { aguardando: "Aguardando aprovação", aprovado: "Aprovado/agendado", correcao: "Em correção", publicado: "Publicado", cancelado: "Cancelado" };

export function PublicationAdminRow({ item }: { item: AdminPublication }) {
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function run(task: () => Promise<{ success: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await task().catch(() => ({ success: false, error: "Sem permissão ou falha de conexão." }));
      if (!result.success) setError(result.error ?? "Não foi possível concluir.");
    });
  }

  const btn = "rounded-full px-3.5 py-1.5 text-[13px] font-medium disabled:opacity-60";
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-white/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-foreground">{item.title}</p>
          <p className="text-[13px] text-muted">
            {item.businessName} · {item.productName} · {formatDateBR(item.scheduledFor)}{item.timeSlot && ` às ${item.timeSlot}`}
          </p>
          <p className="text-[13px] text-muted">
            {STATUS_LABEL[item.status] ?? item.status} · pagamento: {item.paymentStatus}
            {item.priceCents > 0 && ` (${formatCents(item.priceCents)})`}
          </p>
        </div>
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- upload da empresa, domínio variável
          <img src={item.imageUrl} alt="" className="h-16 w-16 rounded-lg border border-border object-cover" />
        )}
      </div>
      {item.body && <p className="text-[14px] text-foreground">{item.body}</p>}
      {item.linkUrl && <p className="break-all text-[13px] text-primary">{item.linkUrl}</p>}
      {item.correctionNote && <p className="text-[13px] text-red-700">Ajuste pedido: {item.correctionNote}</p>}

      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
        {item.paymentStatus === "pendente" && (
          <>
            <button type="button" disabled={isPending} onClick={() => run(() => confirmPublicationPayment(item.id, "pago"))} className={`${btn} neu-primary text-white`}>Confirmar pagamento</button>
            <button type="button" disabled={isPending} onClick={() => run(() => confirmPublicationPayment(item.id, "isento"))} className={`${btn} neu text-foreground`}>Isentar</button>
          </>
        )}
        {(item.status === "aguardando" || item.status === "correcao") && (
          <button type="button" disabled={isPending} onClick={() => run(() => approvePublication(item.id))} className={`${btn} neu-primary text-white`}>Aprovar e agendar</button>
        )}
        {item.status === "aguardando" && (
          <button type="button" disabled={isPending} onClick={() => setAsking((v) => !v)} className={`${btn} neu text-foreground`}>Pedir correção</button>
        )}
        {item.status === "aprovado" && (
          <button type="button" disabled={isPending} onClick={() => run(() => markPublicationPublished(item.id))} className={`${btn} neu-primary text-white`}>Marcar como publicado</button>
        )}
      </div>
      {asking && (
        <div className="flex flex-col gap-2">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="O que a empresa precisa ajustar?" className="w-full rounded-xl border border-border bg-white px-3 py-2 text-[14px]" />
          <button type="button" disabled={isPending} onClick={() => run(() => requestPublicationCorrection(item.id, note))} className={`${btn} self-start border border-red-200 text-red-700`}>Enviar pedido de correção</button>
        </div>
      )}
      {error && <p className="text-[13px] text-red-700">{error}</p>}
    </li>
  );
}
