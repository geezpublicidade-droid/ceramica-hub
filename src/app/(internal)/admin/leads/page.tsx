import { requireAdminPage } from "@/lib/auth-guards";
import { createServiceClient } from "@/lib/supabase/server";
import { getAllLeadsForAdmin } from "@/lib/services/partner-leads";
import { getAllLeads } from "@/lib/services/leads";
import { getAssignableAdmins } from "@/lib/services/admins";
import { getActiveTowers } from "@/lib/services/towers";
import { LeadRow } from "@/components/admin/LeadRow";
import { LeadFilters } from "@/components/admin/LeadFilters";
import { NewLeadForm } from "@/components/admin/NewLeadForm";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = { title: "Leads — Cerâmica Hub" };

async function getApprovedBusinessesForSelect() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("status", "approved")
    .order("name");
  if (error) throw error;
  return (data ?? []) as { id: string; name: string }[];
}

export default async function AdminLeadsPage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "comercial"]);
  const [leads, partnerLeads, admins, towers, businesses] = await Promise.all([
    getAllLeads(),
    getAllLeadsForAdmin(),
    getAssignableAdmins(),
    getActiveTowers(),
    getApprovedBusinessesForSelect(),
  ]);

  return (
    <AdminShell currentPath="/admin/leads" adminRole={adminRole} wide>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Leads</h1>
        <p className="mt-2 text-[16px] text-muted">
          Funil comercial completo — do primeiro contato até fechar ou perder. Nada aqui publica ou cobra
          sozinho, é só controle manual do time.
        </p>
      </div>

      <NewLeadForm admins={admins} towers={towers} />

      <section className="flex flex-col gap-3">
        <p className="text-[17px] font-semibold text-foreground">Funil ({leads.length})</p>
        <LeadFilters leads={leads} admins={admins} businesses={businesses} />
      </section>

      <section className="mt-4 flex flex-col gap-3">
        <div>
          <p className="text-[17px] font-semibold text-foreground">Leads de parceria/anúncio ({partnerLeads.length})</p>
          <p className="text-[14px] text-muted">
            Recebidos pelo formulário público &quot;Seja um Parceiro&quot; — separado do funil acima porque
            já chega com interesse definido (anunciante/patrocinador).
          </p>
        </div>
        {partnerLeads.length === 0 && <p className="text-[15px] text-muted">Nenhum lead recebido ainda.</p>}
        {partnerLeads.map((lead) => (
          <LeadRow key={lead.id} lead={lead} />
        ))}
      </section>
    </AdminShell>
  );
}
