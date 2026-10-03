import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getBusinessById } from "@/lib/services/platform";
import { getMonthlyReport, isValidMonth, monthRange, previousMonthKey, formatMonthLabel } from "@/lib/services/business-results";
import { PlacementResultsSection } from "@/components/dashboard/PlacementResultsSection";
import { getBusinessPlacementResults } from "@/lib/services/placement-metrics";
import { DeltaBadge } from "@/components/dashboard/DeltaBadge";
import { ResultsChart } from "@/components/dashboard/ResultsChart";
import { PrintButton } from "@/components/dashboard/PrintButton";

export const metadata = { title: "Relatório mensal — Cerâmica Hub" };

type PageProps = { searchParams: Promise<{ mes?: string }> };

export default async function MonthlyReportPage({ searchParams }: PageProps) {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) redirect("/login");

  const business = await getBusinessById(businessId);
  if (!business) redirect("/login");
  if (business.effectivePlan === "presenca") redirect("/dashboard/resultados");

  const { mes } = await searchParams;
  const month = isValidMonth(mes) ? mes : previousMonthKey();
  const { results, previousTotals } = await getMonthlyReport(businessId, month);
  const { totals, daily } = results;
  const range = monthRange(month);
  const placements = await getBusinessPlacementResults(businessId, range.from, range.to);

  const rows = [
    { label: "Visualizações da página", value: totals.views, previous: previousTotals.views },
    { label: "Contatos gerados", value: totals.leads, previous: previousTotals.leads },
    { label: "Cliques no WhatsApp", value: totals.whatsapp, previous: previousTotals.whatsapp },
    { label: "Cliques no telefone", value: totals.phone, previous: previousTotals.phone },
    { label: "Cliques no site", value: totals.website, previous: previousTotals.website },
    { label: "Cliques em “como chegar”", value: totals.directions, previous: previousTotals.directions },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16 print:py-6">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/dashboard/resultados" className="text-[15px] text-muted hover:text-foreground">
          ← Voltar aos resultados
        </Link>
        <PrintButton />
      </div>

      <header className="mt-8 print:mt-0">
        <p className="text-[14px] uppercase tracking-[0.15em] text-muted">Relatório mensal · Cerâmica Hub</p>
        <h1 className="mt-2 text-3xl font-semibold capitalize text-foreground">{formatMonthLabel(month)}</h1>
        <p className="mt-1 text-[17px] text-muted">{business.name}</p>
      </header>

      <table className="mt-8 w-full border-collapse text-left">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-border">
              <td className="py-3 text-[16px] text-foreground">{row.label}</td>
              <td className="py-3 text-right text-[20px] font-semibold text-foreground">{row.value}</td>
              <td className="py-3 pl-4 text-right">
                <DeltaBadge current={row.value} previous={row.previous} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totals.views > 0 && (
        <section className="mt-10">
          <p className="mb-4 text-[14px] text-muted">Visualizações por dia</p>
          <ResultsChart data={daily} />
        </section>
      )}
      <div className="mt-10">
        <PlacementResultsSection placements={placements} periodLabel={formatMonthLabel(month)} />
      </div>
      {totals.views === 0 && totals.leads === 0 && <p className="mt-8 text-[15px] text-muted">Sem atividade registrada neste mês.</p>}
    </main>
  );
}
