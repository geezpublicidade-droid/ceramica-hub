import { requireAdminPage } from "@/lib/auth-guards";
import { getAllReviewsForAdmin } from "@/lib/services/reviews";
import { ReviewRow } from "@/components/admin/ReviewRow";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = { title: "Avaliações — Cerâmica Hub" };

export default async function AdminAvaliacoesPage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "moderador", "conteudo"]);
  const reviews = await getAllReviewsForAdmin();
  const pending = reviews.filter((r) => r.status === "pendente");
  const rest = reviews.filter((r) => r.status !== "pendente");

  return (
    <AdminShell currentPath="/admin/avaliacoes" adminRole={adminRole}>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Avaliações de empresas</h1>
        <p className="mt-2 text-[16px] text-muted">
          Avaliações enviadas por membros logados. Só aparece na página da empresa depois de aprovada aqui.
        </p>
      </div>

      {pending.length > 0 && (
        <section className="flex flex-col gap-3">
          <p className="text-[17px] font-semibold text-foreground">Pendentes de aprovação ({pending.length})</p>
          {pending.map((review) => (
            <ReviewRow key={review.id} review={review} />
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <p className="text-[17px] font-semibold text-foreground">Todas ({rest.length})</p>
        {rest.length === 0 && <p className="text-[15px] text-muted">Nenhuma avaliação aprovada ou rejeitada ainda.</p>}
        {rest.map((review) => (
          <ReviewRow key={review.id} review={review} />
        ))}
      </section>
    </AdminShell>
  );
}
