import { requireAdminPage } from "@/lib/auth-guards";
import { createServiceClient } from "@/lib/supabase/server";
import { loadPlanCatalog } from "@/lib/services/plan-catalog";
import { loadPlanPrices } from "@/lib/services/plan-prices";
import { AdminShell } from "@/components/admin/AdminShell";
import { PlansCatalogEditor } from "@/components/admin/plan/PlansCatalogEditor";

export const metadata = { title: "Planos — Cerâmica Hub" };
export const dynamic = "force-dynamic";

export default async function AdminPlansPage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "financeiro", "comercial"]);
  const [catalog, prices, companies] = await Promise.all([
    loadPlanCatalog({ fresh: true }),
    loadPlanPrices(),
    createServiceClient().from("businesses").select("plan"),
  ]);
  const companyCounts: Record<string, number> = {};
  for (const row of companies.data ?? []) companyCounts[row.plan] = (companyCounts[row.plan] ?? 0) + 1;
  const canEdit = adminRole === "super_admin";

  return (
    <AdminShell currentPath="/admin/planos" adminRole={adminRole} wide>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Planos e recursos</h1>
        <p className="mt-1 max-w-3xl text-[15px] text-muted">
          O que cada plano libera na página pública, no painel da empresa e no posicionamento. Esta tela é a fonte: o site, o painel e o banco leem estes valores.
          {catalog.source === "defaults" ? " ⚠ O banco estava indisponível: mostrando o padrão de fábrica." : ""}
        </p>
      </div>
      {canEdit ? (
        <PlansCatalogEditor
          plans={catalog.plans}
          features={catalog.features}
          graceDays={catalog.graceDays}
          prices={Object.fromEntries(Object.entries(prices).map(([key, value]) => [key, { monthlyCents: value.monthlyCents }]))}
          companyCounts={companyCounts}
        />
      ) : (
        <p className="rounded-xl border border-border bg-white p-6 text-[15px]">Apenas administradores podem editar o catálogo de planos.</p>
      )}
    </AdminShell>
  );
}
