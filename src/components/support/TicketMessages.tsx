import type { SupportMessage } from "@/lib/services/support";

/** Bolha alinhada à direita = "eu" (quem está vendo a tela), à esquerda =
 * "o outro lado" -- pro empresário/membro "eu" é `sender_type === "requester"`,
 * pro admin é o oposto (`viewerIsAdmin`). */
export function TicketMessages({ messages, viewerIsAdmin }: { messages: SupportMessage[]; viewerIsAdmin: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      {messages.map((message) => {
        const mine = viewerIsAdmin ? message.senderType === "admin" : message.senderType === "requester";
        return (
          <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                mine ? "bg-primary text-white" : "border border-border bg-white/80 text-foreground"
              }`}
            >
              <p className={`text-[13px] font-medium ${mine ? "text-white/80" : "text-muted"}`}>{message.senderName}</p>
              <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed">{message.body}</p>
              <p className={`mt-1.5 text-[11px] ${mine ? "text-white/70" : "text-muted"}`}>
                {new Date(message.createdAt).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
