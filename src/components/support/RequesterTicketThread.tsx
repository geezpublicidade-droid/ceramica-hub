"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TicketMessages } from "@/components/support/TicketMessages";
import { addRequesterMessageAction } from "@/lib/actions/support";
import type { SupportMessage, SupportTicketStatus } from "@/lib/services/support";

const inputClass =
  "w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";

/** Thread do lado de quem abriu o chamado (empresa ou membro) -- mesmo
 * componente pros dois, já que `addRequesterMessageAction` deriva o dono da
 * própria sessão. Painel do admin usa `AdminTicketThread`, que fala com
 * outra action e tem controle de status. */
export function RequesterTicketThread({ ticketId, messages, status }: { ticketId: string; messages: SupportMessage[]; status: SupportTicketStatus }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addRequesterMessageAction(ticketId, { body });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setBody("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <TicketMessages messages={messages} viewerIsAdmin={false} />

      {status === "fechado" && (
        <p className="text-[14px] text-muted">
          Este chamado foi encerrado. Envie uma nova mensagem se ainda precisar de ajuda — ele reabre automaticamente.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          className={inputClass}
          rows={3}
          placeholder="Escreva uma mensagem..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        {error && <p className="text-[14px] text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isPending || !body.trim()}
          className="neu-primary self-start rounded-full px-6 py-2.5 text-[15px] font-medium text-white disabled:opacity-60"
        >
          {isPending ? "Enviando..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}
