import Link from "next/link";
import { TicketStatusPill } from "@/components/support/TicketStatusPill";
import type { SupportTicket } from "@/lib/services/support";

type TicketListItem = SupportTicket & { meta?: string };

/** Lista compartilhada por empresa, membro e admin -- `meta` é o único ponto
 * de variação real entre os três (admin mostra "Empresa X · empresa", os
 * outros dois não precisam). */
export function SupportTicketList({ tickets, basePath }: { tickets: TicketListItem[]; basePath: string }) {
  if (tickets.length === 0) {
    return <p className="text-[15px] text-muted">Nenhum chamado ainda.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {tickets.map((ticket) => (
        <Link
          key={ticket.id}
          href={`${basePath}/${ticket.id}`}
          className="glass-light flex items-center justify-between gap-4 rounded-2xl p-4 transition hover:bg-black/5"
        >
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium text-foreground">{ticket.subject}</p>
            <p className="mt-0.5 truncate text-[13px] text-muted">
              {ticket.meta ? `${ticket.meta} · ` : ""}
              Atualizado em{" "}
              {new Date(ticket.updatedAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </p>
          </div>
          <TicketStatusPill status={ticket.status} />
        </Link>
      ))}
    </div>
  );
}
