import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getOwnedTicket } from "@/lib/services/support";
import { BackLink } from "@/components/nav/BackLink";
import { TicketStatusPill } from "@/components/support/TicketStatusPill";
import { RequesterTicketThread } from "@/components/support/RequesterTicketThread";

export const metadata = { title: "Chamado — Cerâmica Hub" };

export default async function MemberTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const memberId = session?.user?.memberId;
  if (!memberId) redirect("/membro/login");

  const ticket = await getOwnedTicket(id, { type: "member", id: memberId });
  if (!ticket) notFound();

  return (
    <main className="min-h-screen px-6 py-24">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="mb-2">
          <BackLink href="/membro/suporte" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold text-foreground">{ticket.subject}</h1>
          <TicketStatusPill status={ticket.status} />
        </div>

        <div className="glass-light rounded-3xl p-6">
          <RequesterTicketThread ticketId={ticket.id} messages={ticket.messages} status={ticket.status} />
        </div>
      </div>
    </main>
  );
}
