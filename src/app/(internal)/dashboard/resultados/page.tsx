import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getBusinessById } from "@/lib/services/platform";
import { getBusinessResults, parsePeriod, previousMonthKey, formatMonthLabel, RESULT_PERIODS } from "@/lib/services/business-results";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { BackLink } from "@/components/nav/BackLink";
import { StatTile } from "@/components/dashboard/StatTile";
import { ResultsChart } from "@/components/dashboard/ResultsChart";
import { DeltaBadge } from "@/components/dashboard/DeltaBadge";
import { RequestActionForm } from "@/components/dashboard/RequestActionForm";

export const metadata = { title: "Resultados — Cerâmica Hub" };

type PageProps = { searchParams: Promise<{ periodo?: string }> };

export default async function DashboardResultadosPage({ searchParams }: PageProps) {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) redirect("/login");

  const business = await getBusinessById(businessId);
  if (!business) redirect("/login");

  // Plano gratuito vê só os últimos 7 dias (mesma regra do painel: detalhe é benefício de plano pago).
  const hasDetailedMetrics = business.effectivePlan !== "presenca";
  const period = hasDetailedMetrics ? parsePeriod((await searchParams).periodo) : 7;
  const { totals, previous, daily } = await getBusinessResults(businessId, period);
  const reportMonth = previousMonthKey();

  const tiles = [
    { label: "Visualizações da página", value: totals.views, previous: previous.views, hint: undefined },
    { label: "Contatos gerados", value: totals.leads, previous: previous.leads, hint: "WhatsApp, telefone e agendamentos" },
    { label: "Cliques no WhatsApp", value: totals.whatsapp, previous: previous.whatsapp, hint: undefined },
    { label: "Cliques no telefone", value: totals.phone, previous: previous.phone, hint: undefined },
    { label: "Cliques no site", value: totals.website, previous: previous.website, hint: undefined },
    { label: "Cliques em “como chegar”", value: totals.directions, previous: previous.directions, hint: undefined },
  ];
  const isEmpty = tiles.every((tile) => tile.value === 0);

  return (
    <main className="min-h-screen px-6 py-16 lg:py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <aside className="lg:sticky lg:top-10 lg:w-64 lg:shrink-0">
          <DashboardNav currentPath="/dashboard/resultados" />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6 lg:max-w-3xl">
          <div className="mb-2">
            <BackLink href="/dashboard" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Resultados</h1>
            <p className="mt-2 text-[16px] text-muted">Como sua empresa está sendo encontrada e procurada no Cerâmica Hub.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {RESULT_PERIODS.map((days) => {
              const locked = !hasDetailedMetrics && days !== 7;
              const className = `rounded-full px-5 py-2 text-[14px] font-medium ${days === period ? "neu-primary text-white" : "neu text-foreground"} ${locked ? "cursor-not-allowed opacity-50" : ""}`;
              return locked ? (
                <span key={days} title="Disponível a partir do plano Profissional" className={className}>
                  {days} dias
                </span>
              ) : (
                <Link key={days} href={`/dashboard/resultados?periodo=${days}`} className={className}>
                  {days} dias
                </Link>
              );
            })}
          </div>

          <div className="glass-light rounded-3xl p-6">
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
              {tiles.map((tile) => (
                <div key={tile.label}>
                  <StatTile label={tile.label} value={tile.value} hint={tile.hint} />
                  {hasDetailedMetrics && <DeltaBadge current={tile.value} previous={tile.previous} />}
                </div>
              ))}
            </div>
            {isEmpty && (
              <p className="mt-6 text-[15px] text-muted">
                Ainda não há dados neste período. Assim que sua página for visitada, os números aparecem aqui.
              </p>
            )}
            {!hasDetailedMetrics && (
              <p className="mt-6 rounded-xl bg-primary/5 px-4 py-3 text-[15px] text-foreground">
                Faça upgrade para ver 30 e 90 dias, comparar com o período anterior e receber o relatório mensal.
              </p>
            )}
          </div>

          {!isEmpty && (
            <div className="glass-light rounded-3xl p-6">
              <p className="mb-4 text-[14px] text-muted">Visualizações por dia (últimos {period} dias)</p>
              <ResultsChart data={daily} />
            </div>
          )}

          {hasDetailedMetrics && (
            <div className="glass-light flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6">
              <div>
                <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">Relatório mensal</p>
                <p className="mt-2 max-w-md text-[15px] text-muted">
                  Resumo de {formatMonthLabel(reportMonth)} pronto pra imprimir ou salvar em PDF.
                </p>
              </div>
              <Link href={`/dashboard/resultados/relatorio?mes=${reportMonth}`} className="neu rounded-full px-6 py-3 text-[15px] font-medium text-foreground">
                Abrir relatório
              </Link>
            </div>
          )}

          <RequestActionForm />
        </div>
      </div>
    </main>
  );
}
