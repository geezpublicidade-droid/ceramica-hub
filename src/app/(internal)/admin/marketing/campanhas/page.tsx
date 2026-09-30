import Link from "next/link";
import { requireAdminPage } from "@/lib/auth-guards";
import { getAllMarketingCampaigns, CAMPAIGN_STATE_LABEL } from "@/lib/services/marketing-campaigns";
import { getAssignableAdmins } from "@/lib/services/admins";
import { listCompaniesForAdmin } from "@/lib/services/companies";
import { getAllAudiences } from "@/lib/services/marketing-audiences";
import { formatCents, formatDateBR } from "@/lib/utils";
import { AdminShell } from "@/components/admin/AdminShell";
import { CampaignForm } from "@/components/admin/CampaignForm";

export const metadata = { title: "Campanhas — Cerâmica Hub" };

export default async function CampaignsPage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "marketing", "conteudo"]);
  const [campaigns, admins, companies, audiences] = await Promise.all([
    getAllMarketingCampaigns(),
    getAssignableAdmins(),
    listCompaniesForAdmin(),
    getAllAudiences(),
  ]);

  return (
    <AdminShell currentPath="/admin/marketing/campanhas" adminRole={adminRole} wide>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Campanhas</h1>
        <p className="mt-2 text-[16px] text-muted">
          Planeje objetivo, público, período, orçamento e canais; vincule peças, disparos e anúncios e acompanhe os resultados.
        </p>
      </div>

      <CampaignForm options={{ admins, companies, audiences }} />

      <section className="flex flex-col gap-2">
        {campaigns.length === 0 && <p className="text-[15px] text-muted">Nenhuma campanha criada ainda.</p>}
        {campaigns.map((campaign) => (
          <Link
            key={campaign.id}
            href={`/admin/marketing/campanhas/${campaign.id}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white/70 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-[15px] font-medium text-foreground">{campaign.name}</p>
              <p className="text-[13px] text-muted">
                {campaign.businessName ?? "Campanha do Hub"} · {formatDateBR(campaign.startsOn)} a {formatDateBR(campaign.endsOn)}
                {campaign.budgetCents != null && ` · ${formatCents(campaign.budgetCents)}`}
              </p>
            </div>
            <span className="rounded-full border border-border px-3 py-1 text-[13px] text-foreground">
              {CAMPAIGN_STATE_LABEL[campaign.status]}
            </span>
          </Link>
        ))}
      </section>
    </AdminShell>
  );
}
