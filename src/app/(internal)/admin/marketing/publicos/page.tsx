import { requireAdminPage } from "@/lib/auth-guards";
import { getAllAudiences, getAudienceFilterOptions } from "@/lib/services/marketing-audiences";
import { getConsentSummary } from "@/lib/services/email-marketing";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AudienceBuilder } from "@/components/admin/AudienceBuilder";
import { AudienceRow } from "@/components/admin/AudienceRow";

export const metadata = { title: "Públicos — Cerâmica Hub" };

export default async function AudiencesPage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "marketing"]);
  const [audiences, options, consent] = await Promise.all([getAllAudiences(), getAudienceFilterOptions(), getConsentSummary()]);

  return (
    <AdminShell currentPath="/admin/marketing/publicos" adminRole={adminRole} wide>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Públicos</h1>
        <p className="mt-2 text-[16px] text-muted">
          Segmente as empresas por categoria, plano, torre, tags e período de cadastro. Só recebem e-mail de marketing
          empresas com consentimento ativo (dado no cadastro ou registrado pelo admin) que não cancelaram a inscrição.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <AdminStatCard label="Empresas aprovadas" value={consent.approvedBusinesses} />
        <AdminStatCard label="Com consentimento ativo" value={consent.withConsent} />
        <AdminStatCard label="Descadastradas" value={consent.unsubscribed} />
      </div>

      <AudienceBuilder options={options} />

      <section>
        <h2 className="text-[17px] font-semibold text-foreground">Públicos salvos ({audiences.length})</h2>
        <div className="mt-3 flex flex-col gap-2">
          {audiences.length === 0 && <p className="text-[15px] text-muted">Nenhum público salvo ainda.</p>}
          {audiences.map((audience) => (
            <AudienceRow key={audience.id} audience={audience} />
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
