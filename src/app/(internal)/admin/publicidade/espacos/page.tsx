import { requireAdminPage } from "@/lib/auth-guards";
import { getPlacementsInventory } from "@/lib/services/ads";
import { NewPlacementForm } from "@/components/admin/NewPlacementForm";
import { PlacementRow } from "@/components/admin/PlacementRow";
import { BackLink } from "@/components/nav/BackLink";

export const metadata = { title: "Espaços de anúncio — Cerâmica Hub" };

export default async function AdminPublicidadeEspacosPage() {
  await requireAdminPage(["super_admin", "admin", "comercial"]);
  const placements = await getPlacementsInventory();

  const soldCount = placements.filter((p) => p.status === "ativo" || p.status === "expirando" || p.status === "reservado").length;

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Espaços de anúncio</h1>
            <p className="mt-2 text-[16px] text-muted">
              Inventário de todas as posições vendáveis do site -- crie novas posições aqui, sem precisar de deploy.
              {placements.length > 0 && ` ${soldCount} de ${placements.length} vendidas ou reservadas agora.`}
            </p>
          </div>
          <BackLink href="/admin/publicidade" />
        </div>

        <div className="mt-10">
          <NewPlacementForm />
        </div>

        <section className="mt-10 flex flex-col gap-3">
          <p className="text-[17px] font-semibold text-foreground">Posições ({placements.length})</p>
          {placements.length === 0 && <p className="text-[15px] text-muted">Nenhuma posição cadastrada ainda.</p>}
          {placements.map((placement) => (
            <PlacementRow key={placement.id} placement={placement} />
          ))}
        </section>
      </div>
    </main>
  );
}
