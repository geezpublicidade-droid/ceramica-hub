import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getOwnedTicket } from "@/lib/services/support";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { BackLink } from "@/components/nav/BackLink";
import { TicketStatusPill } from "@/components/support/TicketStatusPill";
import { RequesterTicketThread } from "@/components/support/RequesterTicketThread";

export const metadata = { title: "Chamado — Cerâmica Hub" };

export default async function DashboardTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) redirect("/login");

  const ticket = await getOwnedTicket(id, { type: "business", id: businessId });
  if (!ticket) notFound();

  return (
    <main className="min-h-screen px-6 py-16 lg:py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <aside className="lg:sticky lg:top-10 lg:w-56 lg:shrink-0">
          <DashboardNav currentPath="/dashboard/suporte" />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6 lg:max-w-3xl">
          <div className="mb-2">
            <BackLink href="/dashboard/suporte" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-semibold text-foreground">{ticket.subject}</h1>
            <TicketStatusPill status={ticket.status} />
          </div>

          <div className="glass-light rounded-3xl p-6">
            <RequesterTicketThread ticketId={ticket.id} messages={ticket.messages} status={ticket.status} />
          </div>
        </div>
      </div>
    </main>
  );
}
