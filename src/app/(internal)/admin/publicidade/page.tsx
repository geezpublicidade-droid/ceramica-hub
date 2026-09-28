import Link from "next/link";
import { requireAdminPage } from "@/lib/auth-guards";
import { getAllCampaigns, getPlacementsInventory, getCampaignMetrics } from "@/lib/services/ads";
import { getAdminDashboardStats } from "@/lib/services/admin-dashboard";
import { campaignPhase } from "@/lib/ads-phase";
import { AdCampaignBoard } from "@/components/admin/AdCampaignBoard";
import { AdsSummaryCards } from "@/components/admin/AdsSummaryCards";
import { NewCampaignForm } from "@/components/admin/NewCampaignForm";
import { ExportCampaignsCsvButton } from "@/components/admin/ExportCampaignsCsvButton";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = { title: "Publicidade — Cerâmica Hub" };

export default async function AdminPublicidadePage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "comercial"]);

  const [campaigns, placements, dashboardStats] = await Promise.all([
    getAllCampaigns(),
    getPlacementsInventory(),
    getAdminDashboardStats(),
  ]);
  // phase calculada uma vez aqui (mesmo "hoje" do request) e propagada pronta
  // pro board/card no client, em vez de cada um recalcular por conta própria.
  const rows = await Promise.all(
    campaigns.map(async (campaign) => ({ campaign, metrics: await getCampaignMetrics(campaign.id), phase: campaignPhase(campaign) }))
  );

  const mrrActiveCents = placements
    .filter((p) => p.status === "ativo" || p.status === "expirando")
    .reduce((sum, p) => sum + (p.monthlyPriceCents ?? 0), 0);
  const negotiatedActiveCents = rows
    .filter((row) => row.phase === "active")
    .reduce((sum, row) => sum + (row.campaign.negotiatedValueCents ?? 0), 0);
  const ctr30d =
    dashboardStats.adImpressionsLast30d > 0
      ? (dashboardStats.adClicksLast30d / dashboardStats.adImpressionsLast30d) * 100
      : 0;
  const pendingReviewCount = rows.filter((row) => row.phase === "pending_review").length;

  return (
    <AdminShell currentPath="/admin/publicidade" adminRole={adminRole} wide>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Publicidade</h1>
          <p className="mt-2 text-[16px] text-muted">
            Campanhas de anunciantes externos — nunca aparecem como membro do complexo, sempre
            rotuladas &quot;Patrocinado&quot;.
          </p>
        </div>
        <Link href="/admin/publicidade/espacos" className="neu shrink-0 rounded-full px-4 py-2 text-[15px] font-medium text-foreground">
          Espaços
        </Link>
      </div>

      <AdsSummaryCards
        mrrActiveCents={mrrActiveCents}
        negotiatedActiveCents={negotiatedActiveCents}
        ctr30d={ctr30d}
        pendingReviewCount={pendingReviewCount}
      />

      <div>
        <div className="flex items-center justify-between">
          <p className="text-[17px] font-semibold text-foreground">Campanhas ({rows.length})</p>
          {rows.length > 0 && <ExportCampaignsCsvButton rows={rows} />}
        </div>
        <div className="mt-4">
          <AdCampaignBoard rows={rows} />
        </div>
      </div>

      <div className="max-w-2xl">
        <p className="text-[17px] font-semibold text-foreground">Nova campanha</p>
        <div className="mt-4">
          <NewCampaignForm placements={placements.filter((p) => p.active)} />
        </div>
      </div>
    </AdminShell>
  );
}
