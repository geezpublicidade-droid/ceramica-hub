import { requireAdminPage } from "@/lib/auth-guards";
import { getPlacementsInventory } from "@/lib/services/ads";
import { NewPlacementForm } from "@/components/admin/NewPlacementForm";
import { PlacementRow } from "@/components/admin/PlacementRow";
import { AdminShell } from "@/components/admin/AdminShell";
import { BackLink } from "@/components/nav/BackLink";

export const metadata = { title: "Espaços de anúncio — Cerâmica Hub" };

export default async function AdminPublicidadeEspacosPage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "comercial"]);
  const placements = await getPlacementsInventory();

  const soldCount = placements.filter((p) => p.status === "ativo" || p.status === "expirando" || p.status === "reservado").length;

  return (
    <AdminShell currentPath="/admin/publicidade/espacos" adminRole={adminRole}>
      <div>
        <BackLink href="/admin/publicidade" />
        <h1 className="mt-3 text-2xl font-semibold text-foreground">Espaços de anúncio</h1>
        <p className="mt-2 text-[16px] text-muted">
          Inventário de todas as posições vendáveis do site -- crie novas posições aqui, sem precisar de deploy.
          {placements.length > 0 && ` ${soldCount} de ${placements.length} vendidas ou reservadas agora.`}
        </p>
      </div>

      <NewPlacementForm />

      <section className="flex flex-col gap-3">
        <p className="text-[17px] font-semibold text-foreground">Posições ({placements.length})</p>
        {placements.length === 0 && <p className="text-[15px] text-muted">Nenhuma posição cadastrada ainda.</p>}
        {placements.map((placement) => (
          <PlacementRow key={placement.id} placement={placement} />
        ))}
      </section>
    </AdminShell>
  );
}
