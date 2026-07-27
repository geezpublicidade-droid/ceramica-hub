import { requireAdminPage } from "@/lib/auth-guards";
import { getAllCampaigns, getAllPlacements, getCampaignMetrics } from "@/lib/services/ads";
import { AdCampaignRow } from "@/components/admin/AdCampaignRow";
import { NewCampaignForm } from "@/components/admin/NewCampaignForm";
import { ExportCampaignsCsvButton } from "@/components/admin/ExportCampaignsCsvButton";
import { BackLink } from "@/components/nav/BackLink";

export const metadata = { title: "Publicidade — Cerâmica Hub" };

export default async function AdminPublicidadePage() {
  await requireAdminPage(["super_admin", "admin", "comercial"]);

  const [campaigns, placements] = await Promise.all([getAllCampaigns(), getAllPlacements()]);
  const rows = await Promise.all(
    campaigns.map(async (campaign) => ({ campaign, metrics: await getCampaignMetrics(campaign.id) }))
  );

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Publicidade</h1>
            <p className="mt-2 text-[16px] text-muted">
              Campanhas de anunciantes externos — nunca aparecem como membro do complexo, sempre
              rotuladas &quot;Patrocinado&quot;.
            </p>
          </div>
          <BackLink href="/admin" />
        </div>

        <div className="mt-10">
          <NewCampaignForm placements={placements} />
        </div>

        <div className="mt-10 flex items-center justify-between">
          <p className="text-[17px] font-semibold text-foreground">Campanhas ({rows.length})</p>
          {rows.length > 0 && <ExportCampaignsCsvButton rows={rows} />}
        </div>

        <section className="mt-4 flex flex-col gap-3">
          {rows.length === 0 && <p className="text-[16px] text-muted">Nenhuma campanha cadastrada ainda.</p>}
          {rows.map(({ campaign, metrics }) => (
            <AdCampaignRow key={campaign.id} campaign={campaign} metrics={metrics} />
          ))}
        </section>
      </div>
    </main>
  );
}
