import Link from "next/link";
import { requireAdminPage } from "@/lib/auth-guards";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { ResultsBusinessTable } from "@/components/admin/ResultsBusinessTable";
import { ResultsTrendChart } from "@/components/admin/ResultsTrendChart";
import {
  getAdOccupancy,
  getBusinessPerformance,
  getCampaignsPerformance,
  getDailyTrend,
  groupPerformanceByCategory,
  groupPerformanceByTower,
} from "@/lib/services/results";

export const metadata = { title: "Resultados — Cerâmica Hub" };

const PERIODS = [
  { days: 7, label: "7 dias" },
  { days: 30, label: "30 dias" },
  { days: 90, label: "90 dias" },
];

function parseDays(value: string | string[] | undefined): number {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return PERIODS.some((p) => p.days === parsed) ? parsed : 30;
}

export default async function AdminResultadosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "marketing", "analista"]);
  const params = await searchParams;
  const days = parseDays(params.days);

  const [businesses, campaigns, occupancy, trend] = await Promise.all([
    getBusinessPerformance(days),
    getCampaignsPerformance(),
    getAdOccupancy(),
    getDailyTrend(days),
  ]);

  const categories = groupPerformanceByCategory(businesses);
  const towers = groupPerformanceByTower(businesses);

  const totalPageViews = businesses.reduce((sum, b) => sum + b.pageViews, 0);
  const totalWhatsapp = businesses.reduce((sum, b) => sum + b.whatsappClicks, 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);

  return (
    <AdminShell currentPath="/admin/resultados" adminRole={adminRole} wide>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Resultados</h1>
          <p className="mt-2 text-[16px] text-muted">
            Desempenho real da plataforma — visualizações, cliques e ocupação publicitária. Empresa sem evento no
            período aparece zerada, não fica de fora.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-border bg-white/70 p-1 sm:rounded-full">
          {PERIODS.map((period) => (
            <Link
              key={period.days}
              href={`/admin/resultados?days=${period.days}`}
              className={`tap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                days === period.days ? "bg-primary text-white" : "text-muted hover:text-foreground"
              }`}
            >
              {period.label}
            </Link>
          ))}
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AdminStatCard label={`Visualizações (${days}d)`} value={totalPageViews} />
        <AdminStatCard label={`Cliques WhatsApp (${days}d)`} value={totalWhatsapp} />
        <AdminStatCard label="Impressões de anúncio (total)" value={totalImpressions} />
        <AdminStatCard label="Ocupação publicitária" value={`${occupancy.occupied}/${occupancy.total}`} highlight={occupancy.percentage >= 80} />
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-[17px] font-semibold text-foreground">Evolução no período</p>
        <ResultsTrendChart points={trend} />
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-[17px] font-semibold text-foreground">Por categoria</p>
        {categories.length === 0 ? (
          <p className="text-[15px] text-muted">Nenhuma empresa aprovada com categoria cadastrada.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-white/60">
            <table className="w-full min-w-[480px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="px-4 py-2.5 font-medium">Categoria</th>
                  <th className="px-4 py-2.5 text-right font-medium">Empresas</th>
                  <th className="px-4 py-2.5 text-right font-medium">Visualizações</th>
                  <th className="px-4 py-2.5 text-right font-medium">WhatsApp</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.label} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-foreground">{c.label}</td>
                    <td className="px-4 py-2.5 text-right text-muted">{c.businessCount}</td>
                    <td className="px-4 py-2.5 text-right text-foreground">{c.pageViews}</td>
                    <td className="px-4 py-2.5 text-right text-foreground">{c.whatsappClicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-[17px] font-semibold text-foreground">Por torre</p>
        {towers.length === 0 ? (
          <p className="text-[15px] text-muted">Nenhuma empresa aprovada com torre cadastrada.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-white/60">
            <table className="w-full min-w-[480px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="px-4 py-2.5 font-medium">Torre</th>
                  <th className="px-4 py-2.5 text-right font-medium">Empresas</th>
                  <th className="px-4 py-2.5 text-right font-medium">Visualizações</th>
                  <th className="px-4 py-2.5 text-right font-medium">WhatsApp</th>
                </tr>
              </thead>
              <tbody>
                {towers.map((t) => (
                  <tr key={t.label} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-foreground">{t.label}</td>
                    <td className="px-4 py-2.5 text-right text-muted">{t.businessCount}</td>
                    <td className="px-4 py-2.5 text-right text-foreground">{t.pageViews}</td>
                    <td className="px-4 py-2.5 text-right text-foreground">{t.whatsappClicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-[17px] font-semibold text-foreground">Por empresa</p>
        <ResultsBusinessTable businesses={businesses} />
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-[17px] font-semibold text-foreground">Campanhas de publicidade</p>
        {campaigns.length === 0 ? (
          <p className="text-[15px] text-muted">Nenhuma campanha cadastrada ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-white/60">
            <table className="w-full min-w-[560px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="px-4 py-2.5 font-medium">Campanha</th>
                  <th className="px-4 py-2.5 font-medium">Anunciante</th>
                  <th className="px-4 py-2.5 font-medium">Posição</th>
                  <th className="px-4 py-2.5 text-right font-medium">Impressões</th>
                  <th className="px-4 py-2.5 text-right font-medium">Cliques</th>
                  <th className="px-4 py-2.5 text-right font-medium">CTR</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.campaignId} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-foreground">{c.title}</td>
                    <td className="px-4 py-2.5 text-muted">{c.advertiserName}</td>
                    <td className="px-4 py-2.5 text-muted">{c.placementName}</td>
                    <td className="px-4 py-2.5 text-right text-foreground">{c.impressions}</td>
                    <td className="px-4 py-2.5 text-right text-foreground">{c.clicks}</td>
                    <td className="px-4 py-2.5 text-right text-foreground">{c.ctr.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalImpressions > 0 && (
              <p className="border-t border-border px-4 py-2.5 text-[13px] text-muted">
                CTR médio geral: {((totalClicks / totalImpressions) * 100).toFixed(1)}%
              </p>
            )}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
