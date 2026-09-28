import { requireAdminPage } from "@/lib/auth-guards";
import { getPendingDataDeletionRequests } from "@/lib/services/platform";
import { AdminDeletionRequestRow } from "@/components/admin/AdminDeletionRequestRow";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = { title: "LGPD — Cerâmica Hub" };

export default async function AdminLgpdPage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin"]);

  const pendingRequests = await getPendingDataDeletionRequests();

  return (
    <AdminShell currentPath="/admin/lgpd" adminRole={adminRole}>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">LGPD</h1>
        <p className="mt-2 text-[16px] text-muted">
          Solicitações de exclusão de dados aguardando revisão. Exportação de dados é
          self-service (a própria empresa baixa direto do painel dela).
        </p>
      </div>

      <section className="flex flex-col gap-3">
        {pendingRequests.length === 0 && (
          <p className="text-[16px] text-muted">Nenhuma solicitação pendente.</p>
        )}
        {pendingRequests.map((request) => (
          <AdminDeletionRequestRow key={request.id} request={request} />
        ))}
      </section>
    </AdminShell>
  );
}
