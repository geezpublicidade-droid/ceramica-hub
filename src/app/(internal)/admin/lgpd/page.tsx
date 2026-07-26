import { requireAdminPage } from "@/lib/auth-guards";
import { getPendingDataDeletionRequests } from "@/lib/services/platform";
import { AdminDeletionRequestRow } from "@/components/admin/AdminDeletionRequestRow";

export const metadata = { title: "LGPD — Cerâmica Hub" };

export default async function AdminLgpdPage() {
  await requireAdminPage(["super_admin", "admin"]);

  const pendingRequests = await getPendingDataDeletionRequests();

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">LGPD</h1>
            <p className="mt-2 text-[14px] text-muted">
              Solicitações de exclusão de dados aguardando revisão. Exportação de dados é
              self-service (a própria empresa baixa direto do painel dela).
            </p>
          </div>
          <a href="/admin" className="neu rounded-full px-4 py-2 text-[13px] font-medium text-foreground">
            ← Voltar
          </a>
        </div>

        <section className="mt-10 flex flex-col gap-3">
          {pendingRequests.length === 0 && (
            <p className="text-[14px] text-muted">Nenhuma solicitação pendente.</p>
          )}
          {pendingRequests.map((request) => (
            <AdminDeletionRequestRow key={request.id} request={request} />
          ))}
        </section>
      </div>
    </main>
  );
}
