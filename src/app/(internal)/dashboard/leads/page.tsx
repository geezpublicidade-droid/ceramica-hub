import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listBusinessLeads } from "@/lib/services/landing-editor-data";
import { LeadsBoard } from "@/components/dashboard/landing/LeadsBoard";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { BackLink } from "@/components/nav/BackLink";

export const metadata = { title: "Leads — Cerâmica Hub" };

export default async function LeadsPage() {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) redirect("/login");

  const leads = await listBusinessLeads(businessId);

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <aside className="lg:sticky lg:top-10 lg:w-64 lg:shrink-0">
          <DashboardNav currentPath="/dashboard/leads" />
        </aside>
        <div className="min-w-0 flex-1 lg:max-w-3xl">
          <div className="mb-6">
            <BackLink href="/dashboard" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Leads</h1>
          <p className="mt-2 text-[16px] text-muted">Pedidos de contato enviados pelo formulário da sua página. Responda rápido: o primeiro contato decide.</p>
          <div className="mt-6">
            <LeadsBoard leads={leads} />
          </div>
        </div>
      </div>
    </main>
  );
}
