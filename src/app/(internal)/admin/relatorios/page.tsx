import Link from "next/link";
import { requireAdminPage } from "@/lib/auth-guards";
import { AdminShell } from "@/components/admin/AdminShell";
import { ReportView } from "@/components/admin/ReportView";
import { currentMonthKey, isMonthKey, nextMonth, previousMonth } from "@/lib/services/executive-goals";
import { getAllPartnersForAdmin } from "@/lib/services/institutional-partners";
import { buildExecutiveReport, buildSalesReport, monthLabel } from "@/lib/services/reports";

export const metadata = { title: "Relatórios — Cerâmica Hub" };
export const dynamic = "force-dynamic";

const EXECUTIVE_ROLES = ["super_admin", "admin", "financeiro", "analista"];
const SALES_ROLES = ["super_admin", "admin", "comercial", "analista"];

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "financeiro", "comercial", "marketing", "analista"]);
  const { mes } = await searchParams;
  const month = mes && isMonthKey(mes) ? mes : previousMonth(currentMonthKey());
  const [executive, sales, partners] = await Promise.all([
    EXECUTIVE_ROLES.includes(adminRole) ? buildExecutiveReport(month) : null,
    SALES_ROLES.includes(adminRole) ? buildSalesReport() : null,
    getAllPartnersForAdmin(),
  ]);

  return (
    <AdminShell currentPath="/admin/relatorios" adminRole={adminRole} wide>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Relatórios</h1>
        <p className="mt-2 text-[16px] text-muted">
          Os mesmos relatórios que seguem por e-mail (executivo no início do mês, comercial toda segunda). Use Imprimir do navegador para gerar PDF.
        </p>
      </div>

      {executive && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-[14px]">
            <Link href={`/admin/relatorios?mes=${previousMonth(month)}`} className="neu rounded-full px-3 py-1.5 text-foreground">
              ← Anterior
            </Link>
            <span className="font-medium capitalize text-foreground">{monthLabel(month)}</span>
            <Link href={`/admin/relatorios?mes=${nextMonth(month)}`} className="neu rounded-full px-3 py-1.5 text-foreground">
              Próximo →
            </Link>
          </div>
          <ReportView report={executive} />
        </div>
      )}

      {sales && <ReportView report={sales} />}

      <section className="rounded-2xl border border-border bg-white/70 p-5">
        <h2 className="text-[18px] font-semibold text-foreground">Outros relatórios</h2>
        <ul className="mt-3 space-y-2 text-[14px]">
          <li>
            <Link href="/admin/resultados" className="font-medium text-primary underline">
              Empresas anunciantes
            </Link>{" "}
            <span className="text-muted">— desempenho por empresa, categoria, torre e campanha. Cada empresa recebe o próprio resumo mensal e vê o relatório em Resultados.</span>
          </li>
          <li>
            <Link href="/admin/analytics" className="font-medium text-primary underline">
              Audiência do portal
            </Link>{" "}
            <span className="text-muted">— visitas, origem, buscas e cliques.</span>
          </li>
        </ul>
        <h3 className="mt-4 text-[15px] font-semibold text-foreground">Empresas Âncoras, Shopping e patrocinadores</h3>
        {partners.length === 0 ? (
          <p className="mt-2 text-[14px] text-muted">Nenhum parceiro cadastrado.</p>
        ) : (
          <ul className="mt-2 space-y-1.5 text-[14px]">
            {partners.map((partner) => (
              <li key={partner.id}>
                <Link href={`/admin/parceiros/${partner.id}/relatorio`} className="font-medium text-primary underline">
                  {partner.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}
