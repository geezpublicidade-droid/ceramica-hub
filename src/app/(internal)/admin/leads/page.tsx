import { requireAdminPage } from "@/lib/auth-guards";
import { getAllLeadsForAdmin } from "@/lib/services/partner-leads";
import { LeadRow } from "@/components/admin/LeadRow";
import { BackLink } from "@/components/nav/BackLink";

export const metadata = { title: "Leads de parceria — Cerâmica Hub" };

export default async function AdminLeadsPage() {
  await requireAdminPage(["super_admin", "admin", "comercial"]);
  const leads = await getAllLeadsForAdmin();

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Leads de parceria</h1>
            <p className="mt-2 text-[16px] text-muted">
              Contatos recebidos pelo formulário público &quot;Seja um Parceiro&quot; — interessados no plano
              Parceiro Estratégico. Acompanhe manualmente, nada aqui publica sozinho.
            </p>
          </div>
          <BackLink href="/admin" />
        </div>

        <section className="mt-10 flex flex-col gap-3">
          <p className="text-[17px] font-semibold text-foreground">Leads ({leads.length})</p>
          {leads.length === 0 && <p className="text-[15px] text-muted">Nenhum lead recebido ainda.</p>}
          {leads.map((lead) => (
            <LeadRow key={lead.id} lead={lead} />
          ))}
        </section>
      </div>
    </main>
  );
}
