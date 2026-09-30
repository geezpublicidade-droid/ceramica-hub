import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth-guards";
import {
  getCampaignCreatives,
  getMarketingCampaignById,
  CAMPAIGN_STATE_LABEL,
} from "@/lib/services/marketing-campaigns";
import { getCampaignResults, getLinkableItems, getLinkedItems } from "@/lib/services/marketing-campaign-links";
import { CONTENT_CHANNEL_LABEL } from "@/lib/services/content-calendar";
import { getAssignableAdmins } from "@/lib/services/admins";
import { listCompaniesForAdmin } from "@/lib/services/companies";
import { getAllAudiences } from "@/lib/services/marketing-audiences";
import { formatCents, formatDateBR } from "@/lib/utils";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { CampaignForm } from "@/components/admin/CampaignForm";
import { CampaignStatusActions } from "@/components/admin/CampaignStatusActions";
import { CampaignCreatives } from "@/components/admin/CampaignCreatives";
import { CampaignLinks } from "@/components/admin/CampaignLinks";
import { CampaignManualResults } from "@/components/admin/CampaignManualResults";

export const metadata = { title: "Campanha — Cerâmica Hub" };

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "marketing", "conteudo"]);
  const { id } = await params;
  const campaign = await getMarketingCampaignById(id);
  if (!campaign) notFound();

  const [creatives, linked, available, admins, companies, audiences] = await Promise.all([
    getCampaignCreatives(id),
    getLinkedItems(id),
    getLinkableItems(),
    getAssignableAdmins(),
    listCompaniesForAdmin(),
    getAllAudiences(),
  ]);
  const results = await getCampaignResults(id, linked, { views: campaign.manualViews, clicks: campaign.manualClicks });

  const summary = [
    campaign.businessName ?? "Campanha do Hub",
    `${formatDateBR(campaign.startsOn)} a ${formatDateBR(campaign.endsOn)}`,
    campaign.budgetCents != null ? formatCents(campaign.budgetCents) : null,
    campaign.audienceName ? `Público: ${campaign.audienceName}` : null,
    campaign.ownerEmail ? `Responsável: ${campaign.ownerEmail}` : null,
    campaign.channels.length ? campaign.channels.map((c) => CONTENT_CHANNEL_LABEL[c]).join(", ") : null,
  ].filter(Boolean);

  return (
    <AdminShell currentPath="/admin/marketing/campanhas" adminRole={adminRole} wide>
      <div>
        <Link href="/admin/marketing/campanhas" className="text-[14px] text-muted underline">
          ← Campanhas
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">{campaign.name}</h1>
        <p className="mt-1 text-[15px] text-muted">
          {CAMPAIGN_STATE_LABEL[campaign.status]} · {summary.join(" · ")}
        </p>
        {campaign.objective && <p className="mt-2 text-[15px] text-foreground">{campaign.objective}</p>}
        {campaign.approvedAt && (
          <p className="mt-1 text-[13px] text-muted">
            Aprovada por {campaign.approvedByEmail ?? "—"} em {new Date(campaign.approvedAt).toLocaleDateString("pt-BR")}
          </p>
        )}
      </div>

      <CampaignStatusActions campaignId={campaign.id} status={campaign.status} />

      <section>
        <h2 className="text-[17px] font-semibold text-foreground">Resultados</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <AdminStatCard label="Visualizações" value={results.views} />
          <AdminStatCard label="Cliques" value={results.clicks} />
          <AdminStatCard label="Leads gerados" value={results.leads} />
          <AdminStatCard label="E-mails enviados / abertos" value={`${results.email.enviados} / ${results.email.aberturas}`} />
          <AdminStatCard label="Anúncios: visualizações / cliques" value={`${results.adImpressions} / ${results.adClicks}`} />
        </div>
        <div className="mt-3">
          <CampaignManualResults
            campaignId={campaign.id}
            initial={{ views: campaign.manualViews, clicks: campaign.manualClicks, notes: campaign.resultsNotes }}
          />
        </div>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-foreground">Peças criativas</h2>
        <div className="mt-3">
          <CampaignCreatives campaignId={campaign.id} creatives={creatives} />
        </div>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-foreground">Vínculos</h2>
        <p className="mt-1 text-[14px] text-muted">
          Peças do calendário, disparos de e-mail e anúncios ligados a esta campanha alimentam os resultados acima.
        </p>
        <div className="mt-3">
          <CampaignLinks campaignId={campaign.id} linked={linked} available={available} />
        </div>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-foreground">Editar campanha</h2>
        <div className="mt-3">
          <CampaignForm campaign={campaign} options={{ admins, companies, audiences }} />
        </div>
      </section>
    </AdminShell>
  );
}
