import { requireAdminPage } from "@/lib/auth-guards";
import { listAllTicketsForAdmin } from "@/lib/services/support";
import { AdminShell } from "@/components/admin/AdminShell";
import { SupportTicketList } from "@/components/support/SupportTicketList";

export const metadata = { title: "Suporte — Cerâmica Hub" };

const REQUESTER_TYPE_LABEL = { business: "Empresa", member: "Membro" } as const;

export default async function AdminSuportePage() {
  const { adminRole } = await requireAdminPage();
  const tickets = await listAllTicketsForAdmin();

  const items = tickets.map((ticket) => ({
    ...ticket,
    meta: `${ticket.requesterName} · ${REQUESTER_TYPE_LABEL[ticket.requesterType]}`,
  }));
  const openCount = tickets.filter((ticket) => ticket.status !== "fechado").length;

  return (
    <AdminShell currentPath="/admin/suporte" adminRole={adminRole}>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Suporte</h1>
        <p className="mt-2 text-[16px] text-muted">
          Chamados abertos por empresas e membros — {openCount} aguardando resposta ou em andamento.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <p className="text-[17px] font-semibold text-foreground">Chamados ({tickets.length})</p>
        <SupportTicketList tickets={items} basePath="/admin/suporte" />
      </section>
    </AdminShell>
  );
}
