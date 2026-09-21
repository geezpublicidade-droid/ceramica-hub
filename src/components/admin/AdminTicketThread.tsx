"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TicketMessages } from "@/components/support/TicketMessages";
import { replyToTicketAction, updateTicketStatusAction } from "@/lib/actions/admin-support";
import type { SupportMessage, SupportTicketStatus } from "@/lib/services/support";

const inputClass =
  "w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";

const STATUS_OPTIONS: { value: SupportTicketStatus; label: string }[] = [
  { value: "aberto", label: "Aguardando resposta" },
  { value: "respondido", label: "Respondido" },
  { value: "fechado", label: "Fechado" },
];

export function AdminTicketThread({
  ticketId,
  messages,
  status,
}: {
  ticketId: string;
  messages: SupportMessage[];
  status: SupportTicketStatus;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleReply(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await replyToTicketAction(ticketId, { body });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setBody("");
      router.refresh();
    });
  }

  function handleStatusChange(newStatus: SupportTicketStatus) {
    startTransition(async () => {
      await updateTicketStatusAction(ticketId, newStatus);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[14px] font-medium text-foreground">Status:</span>
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={isPending}
            onClick={() => handleStatusChange(option.value)}
            className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-60 ${
              status === option.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <TicketMessages messages={messages} viewerIsAdmin />

      <form onSubmit={handleReply} className="flex flex-col gap-2">
        <textarea
          className={inputClass}
          rows={3}
          placeholder="Responder ao chamado..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        {error && <p className="text-[14px] text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isPending || !body.trim()}
          className="neu-primary self-start rounded-full px-6 py-2.5 text-[15px] font-medium text-white disabled:opacity-60"
        >
          {isPending ? "Enviando..." : "Responder"}
        </button>
      </form>
    </div>
  );
}
