import { requireAdminPage } from "@/lib/auth-guards";
import { getAllPartnersForAdmin } from "@/lib/services/institutional-partners";
import { NewPartnerForm } from "@/components/admin/NewPartnerForm";
import { PartnerRow } from "@/components/admin/PartnerRow";
import { FOUNDER_QUOTA } from "@/lib/partner-tiers";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = { title: "Parceiros institucionais — Cerâmica Hub" };

export default async function AdminParceirosPage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "comercial"]);
  const partners = await getAllPartnersForAdmin();
  const founders = partners.filter((p) => p.tier === "ancora_fundadora" && p.status !== "inativo").length;

  return (
    <AdminShell currentPath="/admin/parceiros" adminRole={adminRole}>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Parceiros institucionais</h1>
        <p className="mt-2 text-[16px] text-muted">
          Prefeitura, shopping, hotéis parceiros etc. Só aparecem no site com status &quot;Ativo&quot; — nunca
          publique um vínculo sem autorização confirmada de verdade.
        </p>
      </div>

      <NewPartnerForm />

      <section className="flex flex-col gap-3">
        <p className="text-[17px] font-semibold text-foreground">Parceiros ({partners.length})</p>
        <p className="text-[14px] text-muted">
          Cotas de Âncora Fundadora: {founders} de {FOUNDER_QUOTA} preenchidas.
        </p>
        {partners.length === 0 && <p className="text-[15px] text-muted">Nenhum parceiro cadastrado ainda.</p>}
        {partners.map((partner) => (
          <PartnerRow key={partner.id} partner={partner} />
        ))}
      </section>
    </AdminShell>
  );
}
