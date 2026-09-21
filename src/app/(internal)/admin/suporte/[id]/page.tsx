import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth-guards";
import { getTicketForAdmin } from "@/lib/services/support";
import { BackLink } from "@/components/nav/BackLink";
import { TicketStatusPill } from "@/components/support/TicketStatusPill";
import { AdminTicketThread } from "@/components/admin/AdminTicketThread";

export const metadata = { title: "Chamado — Cerâmica Hub" };

const REQUESTER_TYPE_LABEL = { business: "Empresa", member: "Membro" } as const;

export default async function AdminTicketPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;

  const ticket = await getTicketForAdmin(id);
  if (!ticket) notFound();

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <BackLink href="/admin/suporte" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{ticket.subject}</h1>
            <p className="mt-1 text-[15px] text-muted">
              {ticket.requesterName} ({REQUESTER_TYPE_LABEL[ticket.requesterType]}) · {ticket.requesterContact}
            </p>
          </div>
          <TicketStatusPill status={ticket.status} />
        </div>

        <div className="mt-6 rounded-3xl border border-border bg-white/70 p-6">
          <AdminTicketThread ticketId={ticket.id} messages={ticket.messages} status={ticket.status} />
        </div>
      </div>
    </main>
  );
}
