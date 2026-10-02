import Link from "next/link";
import { requireAdminPage } from "@/lib/auth-guards";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { RankedList } from "@/components/admin/RankedList";
import { getPortalAnalytics } from "@/lib/services/portal-analytics";

export const metadata = { title: "Analytics do portal — Cerâmica Hub" };
export const dynamic = "force-dynamic";

const PERIODS = [7, 30, 90];

function parseDays(value: string | undefined): number {
  const parsed = Number(value);
  return PERIODS.includes(parsed) ? parsed : 30;
}

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "marketing", "analista"]);
  const days = parseDays((await searchParams).days);
  const data = await getPortalAnalytics(days);
  const totalClicks = data.clicks.whatsapp + data.clicks.phone + data.clicks.website + data.clicks.directions;
  const noResultTotal = data.noResultSearches.reduce((sum, item) => sum + item.total, 0);
  const peakDay = data.dailyVisits.reduce<{ day: string; total: number } | null>(
    (best, d) => (!best || d.total > best.total ? d : best),
    null
  );

  return (
    <AdminShell currentPath="/admin/analytics" adminRole={adminRole} wide>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Analytics do portal</h1>
        <p className="mt-2 text-[16px] text-muted">
          Visitas, buscas e cliques de contato. Só entram eventos reais, sem IP nem dado pessoal; sem registro, o valor é zero.
        </p>
        <div className="mt-3 flex gap-2 text-[14px]">
          {PERIODS.map((p) => (
            <Link
              key={p}
              href={`/admin/analytics?days=${p}`}
              className={`rounded-full px-3 py-1.5 ${p === days ? "bg-primary text-white" : "neu text-foreground"}`}
            >
              {p} dias
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <AdminStatCard label="Visitas (páginas abertas)" value={data.visits} />
        <AdminStatCard label="Cliques de contato" value={totalClicks} />
        <AdminStatCard label="Cliques no WhatsApp" value={data.clicks.whatsapp} />
        <AdminStatCard label="Telefone · Site · Rota" value={`${data.clicks.phone} · ${data.clicks.website} · ${data.clicks.directions}`} />
        <AdminStatCard label={peakDay ? `Pico de visitas (${peakDay.day})` : "Pico de visitas"} value={peakDay?.total ?? 0} />
        <AdminStatCard label="Buscas sem resultado" value={noResultTotal} highlight={noResultTotal > 0} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <RankedList title="Páginas mais acessadas" items={data.topPages} empty="Ainda sem visitas no período." />
        <RankedList title="Origem dos visitantes" items={data.topSources} empty="Ainda sem visitas no período." />
        <RankedList title="Categorias mais procuradas" items={data.topCategories} empty="Nenhuma categoria visitada." />
        <RankedList title="Pesquisas mais feitas" items={data.topSearches} empty="Nenhuma pesquisa no período." />
        <RankedList title="Termos sem resultado (demanda não atendida)" items={data.noResultSearches} empty="Nenhuma busca ficou sem resposta." />
        <RankedList
          title="Empresas mais vistas"
          items={data.topBusinesses.map((b) => ({
            label: `${b.label} · ${b.clicks} clique(s) · ${b.views ? Math.round((b.clicks / b.views) * 100) : 0}% conversão`,
            total: b.views,
          }))}
          empty="Nenhuma empresa visualizada."
        />
      </div>

      <p className="text-[14px] text-muted">
        Conversões por empresa e por campanha em detalhe:{" "}
        <Link href="/admin/resultados" className="text-primary underline">
          Resultados
        </Link>
        .
      </p>
    </AdminShell>
  );
}
