import { requireAdminPage } from "@/lib/auth-guards";
import { getAllLeadsForAdmin } from "@/lib/services/partner-leads";
import { LeadRow } from "@/components/admin/LeadRow";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = { title: "Leads de parceria — Cerâmica Hub" };

export default async function AdminLeadsPage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "comercial"]);
  const leads = await getAllLeadsForAdmin();

  return (
    <AdminShell currentPath="/admin/leads" adminRole={adminRole}>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Leads de parceria</h1>
        <p className="mt-2 text-[16px] text-muted">
          Contatos recebidos pelo formulário público &quot;Seja um Parceiro&quot; — interessados no plano
          Parceiro Estratégico. Acompanhe manualmente, nada aqui publica sozinho.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <p className="text-[17px] font-semibold text-foreground">Leads ({leads.length})</p>
        {leads.length === 0 && <p className="text-[15px] text-muted">Nenhum lead recebido ainda.</p>}
        {leads.map((lead) => (
          <LeadRow key={lead.id} lead={lead} />
        ))}
      </section>
    </AdminShell>
  );
}
