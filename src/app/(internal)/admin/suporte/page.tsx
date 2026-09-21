import { requireAdminPage } from "@/lib/auth-guards";
import { listAllTicketsForAdmin } from "@/lib/services/support";
import { BackLink } from "@/components/nav/BackLink";
import { SupportTicketList } from "@/components/support/SupportTicketList";

export const metadata = { title: "Suporte — Cerâmica Hub" };

const REQUESTER_TYPE_LABEL = { business: "Empresa", member: "Membro" } as const;

export default async function AdminSuportePage() {
  await requireAdminPage();
  const tickets = await listAllTicketsForAdmin();

  const items = tickets.map((ticket) => ({
    ...ticket,
    meta: `${ticket.requesterName} · ${REQUESTER_TYPE_LABEL[ticket.requesterType]}`,
  }));
  const openCount = tickets.filter((ticket) => ticket.status !== "fechado").length;

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Suporte</h1>
            <p className="mt-2 text-[16px] text-muted">
              Chamados abertos por empresas e membros — {openCount} aguardando resposta ou em andamento.
            </p>
          </div>
          <BackLink href="/admin" />
        </div>

        <section className="mt-10 flex flex-col gap-3">
          <p className="text-[17px] font-semibold text-foreground">Chamados ({tickets.length})</p>
          <SupportTicketList tickets={items} basePath="/admin/suporte" />
        </section>
      </div>
    </main>
  );
}
