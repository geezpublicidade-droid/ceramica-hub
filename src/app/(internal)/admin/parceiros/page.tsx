import { requireAdminPage } from "@/lib/auth-guards";
import { getAllPartnersForAdmin } from "@/lib/services/institutional-partners";
import { NewPartnerForm } from "@/components/admin/NewPartnerForm";
import { PartnerRow } from "@/components/admin/PartnerRow";
import { BackLink } from "@/components/nav/BackLink";

export const metadata = { title: "Parceiros institucionais — Cerâmica Hub" };

export default async function AdminParceirosPage() {
  await requireAdminPage(["super_admin", "admin"]);
  const partners = await getAllPartnersForAdmin();

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Parceiros institucionais</h1>
            <p className="mt-2 text-[16px] text-muted">
              Prefeitura, shopping, hotéis parceiros etc. Só aparecem no site com status "Ativo" — nunca
              publique um vínculo sem autorização confirmada de verdade.
            </p>
          </div>
          <BackLink href="/admin" />
        </div>

        <div className="mt-10">
          <NewPartnerForm />
        </div>

        <section className="mt-10 flex flex-col gap-3">
          <p className="text-[17px] font-semibold text-foreground">Parceiros ({partners.length})</p>
          {partners.length === 0 && <p className="text-[15px] text-muted">Nenhum parceiro cadastrado ainda.</p>}
          {partners.map((partner) => (
            <PartnerRow key={partner.id} partner={partner} />
          ))}
        </section>
      </div>
    </main>
  );
}
