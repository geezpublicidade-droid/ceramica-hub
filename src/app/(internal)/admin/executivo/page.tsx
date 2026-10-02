import Link from "next/link";
import { requireAdminPage } from "@/lib/auth-guards";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { GoalRow } from "@/components/admin/GoalRow";
import { getExecutiveDashboard } from "@/lib/services/executive-dashboard";
import { currentMonthKey, isMonthKey, nextMonth, percentChange, previousMonth } from "@/lib/services/executive-goals";
import { formatCents } from "@/lib/utils";

export const metadata = { title: "Dashboard executivo — Cerâmica Hub" };

const EXECUTIVE_ROLES = ["super_admin", "admin", "financeiro", "analista"] as const;
const GOAL_EDIT_ROLES = ["super_admin", "admin", "financeiro"];
const PLAN_LABEL: Record<string, string> = {
  presenca: "Presença",
  profissional: "Profissional",
  destaque: "Destaque",
  experiencia: "Experiência",
  premium: "Premium",
  patrocinador: "Patrocinador",
};

function monthLabel(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  return new Date(Date.UTC(year, mon - 1, 1)).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
}

/** "+12% vs mês anterior", ou nada quando o mês anterior não dá base de comparação. */
function versusPrevious(current: number, previous: number): string {
  const change = percentChange(current, previous);
  if (change === null) return "sem base no mês anterior";
  return `${change > 0 ? "+" : ""}${change}% vs mês anterior`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[17px] font-semibold text-foreground">{title}</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
    </section>
  );
}

export default async function ExecutiveDashboardPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { adminRole } = await requireAdminPage([...EXECUTIVE_ROLES]);
  const { mes } = await searchParams;
  const month = mes && isMonthKey(mes) ? mes : currentMonthKey();
  const data = await getExecutiveDashboard(month);
  const { current, previous } = data;
  const canEditGoals = adminRole === "super_admin" || GOAL_EDIT_ROLES.includes(adminRole);

  return (
    <AdminShell currentPath="/admin/executivo" adminRole={adminRole} wide>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard executivo</h1>
        <p className="mt-2 text-[16px] text-muted">
          Receita, contratos, renovação e metas do negócio. Só entram números reais: sem registro, o valor é zero.
        </p>
        <div className="mt-3 flex items-center gap-3 text-[14px]">
          <Link href={`/admin/executivo?mes=${previousMonth(month)}`} className="neu rounded-full px-3 py-1.5 text-foreground">
            ← Anterior
          </Link>
          <span className="font-medium capitalize text-foreground">{monthLabel(month)}</span>
          <Link href={`/admin/executivo?mes=${nextMonth(month)}`} className="neu rounded-full px-3 py-1.5 text-foreground">
            Próximo →
          </Link>
        </div>
      </div>

      <Section title="Receita">
        <AdminStatCard label={`Receita do mês · ${versusPrevious(current.revenueCents, previous.revenueCents)}`} value={formatCents(current.revenueCents)} />
        <AdminStatCard label={`Receita do ano (${month.slice(0, 4)})`} value={formatCents(data.yearRevenueCents)} />
        <AdminStatCard label={`Receita recorrente mensal · ${data.activeSubscriptions} assinatura(s) ativa(s)`} value={formatCents(data.mrrCents)} />
        <AdminStatCard label={`Ticket médio · ${current.paidInvoices} fatura(s) paga(s)`} value={formatCents(current.ticketCents)} />
      </Section>

      <Section title="Empresas e contratos">
        <AdminStatCard label="Empresas ativas" value={data.activeBusinesses} />
        <AdminStatCard label={`Novas empresas · ${versusPrevious(current.newBusinesses, previous.newBusinesses)}`} value={current.newBusinesses} />
        <AdminStatCard label={`Novos contratos · ${versusPrevious(current.newContracts, previous.newContracts)}`} value={current.newContracts} />
        <AdminStatCard label="Cancelamentos e expirações no mês" value={current.churned} highlight={current.churned > 0} />
        <AdminStatCard
          label={`Taxa de renovação · ${current.renewalDue} contrato(s) venciam`}
          value={current.renewalRate === null ? "—" : `${current.renewalRate}%`}
        />
        <AdminStatCard
          label={`Inadimplência · ${formatCents(data.delinquentCents)}/mês em atraso`}
          value={data.delinquentCount}
          highlight={data.delinquentCount > 0}
        />
        <AdminStatCard
          label={`Espaços publicitários vendidos de ${data.adOccupancy.capacity}`}
          value={`${data.adOccupancy.sold} (${data.adOccupancy.percent}%)`}
        />
      </Section>

      <section>
        <h2 className="text-[17px] font-semibold text-foreground">Empresas por plano</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(data.businessesByPlan).length === 0 && <p className="text-[15px] text-muted">Nenhuma empresa aprovada ainda.</p>}
          {Object.entries(data.businessesByPlan).map(([plan, total]) => (
            <span key={plan} className="rounded-full border border-border bg-white/70 px-4 py-2 text-[14px] text-foreground">
              {PLAN_LABEL[plan] ?? plan}: <strong>{total}</strong>
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-foreground">Metas de {monthLabel(month)}</h2>
        <p className="mt-1 text-[14px] text-muted">
          Ocupação publicitária e renovação usam o retrato de hoje. {canEditGoals ? "Deixe em branco e salve para remover uma meta." : "Só o financeiro e a administração editam metas."}
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {data.goals.map((goal) => (
            <GoalRow key={goal.metric} goal={{ month, ...goal }} canEdit={canEditGoals} />
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
