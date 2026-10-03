import Link from "next/link";
import { requireAdminPage } from "@/lib/auth-guards";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { LEAD_STAGE_LABEL } from "@/lib/services/leads";
import { getScoredCustomers, getScoredLeads } from "@/lib/services/scoring-data";
import { CUSTOMER_BAND_LABEL, type CustomerBand, type LeadBand } from "@/lib/services/scoring";

export const metadata = { title: "Pontuação — Cerâmica Hub" };
export const dynamic = "force-dynamic";

const LEAD_BAND_LABEL: Record<LeadBand, string> = { quente: "Quente", morno: "Morno", frio: "Frio" };
const BAND_CLASS: Record<LeadBand | CustomerBand, string> = {
  quente: "bg-red-100 text-red-700",
  morno: "bg-yellow-100 text-yellow-700",
  frio: "bg-blue-100 text-blue-700",
  saudavel: "bg-green-100 text-green-700",
  atencao: "bg-yellow-100 text-yellow-700",
  risco: "bg-red-100 text-red-700",
};

function Badge({ band, label }: { band: LeadBand | CustomerBand; label: string }) {
  return <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${BAND_CLASS[band]}`}>{label}</span>;
}

function Reasons({ reasons }: { reasons: string[] }) {
  return <span className="text-[13px] text-muted">{reasons.length > 0 ? reasons.join(" · ") : "—"}</span>;
}

const th = "px-3 py-2 text-left text-[13px] font-medium text-muted";
const td = "px-3 py-2 align-top text-[14px] text-foreground";

export default async function ScoringPage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "comercial", "marketing", "analista"]);
  const [leads, customers] = await Promise.all([getScoredLeads(), getScoredCustomers()]);
  const hot = leads.filter((l) => l.score.band === "quente").length;
  const risk = customers.filter((c) => c.health.band === "risco").length;
  const attention = customers.filter((c) => c.health.band === "atencao").length;

  return (
    <AdminShell currentPath="/admin/pontuacao" adminRole={adminRole} wide>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Pontuação de leads e clientes</h1>
        <p className="mt-2 text-[16px] text-muted">
          Calculada na hora com estágio, valor, contato recente, propostas, engajamento e contrato. É uma estimativa para priorizar a equipe, não uma garantia.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AdminStatCard label="Leads em andamento" value={leads.length} />
        <AdminStatCard label="Leads quentes" value={hot} highlight={hot > 0} />
        <AdminStatCard label="Clientes em risco" value={risk} highlight={risk > 0} />
        <AdminStatCard label="Requerem atenção" value={attention} />
      </div>

      <section>
        <h2 className="text-[17px] font-semibold text-foreground">Leads</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-white/70">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr>
                <th className={th}>Lead</th>
                <th className={th}>Estágio</th>
                <th className={th}>Pontos</th>
                <th className={th}>Classificação</th>
                <th className={th}>Prob. de fechar</th>
                <th className={th}>Dias sem contato</th>
                <th className={th}>Motivos</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr>
                  <td className={td} colSpan={7}>
                    Nenhum lead em andamento.
                  </td>
                </tr>
              )}
              {leads.map(({ lead, score }) => (
                <tr key={lead.id} className="border-t border-border">
                  <td className={td}>
                    <Link href="/admin/leads" className="tap font-medium text-primary underline">
                      {lead.contactName}
                    </Link>
                    {lead.companyName && <span className="block text-[13px] text-muted">{lead.companyName}</span>}
                  </td>
                  <td className={td}>{LEAD_STAGE_LABEL[lead.stage]}</td>
                  <td className={td}>{score.score}</td>
                  <td className={td}>
                    <Badge band={score.band} label={LEAD_BAND_LABEL[score.band]} />
                  </td>
                  <td className={td}>{score.closeProbability}%</td>
                  <td className={td}>{score.daysSinceContact}</td>
                  <td className={td}>
                    <Reasons reasons={score.reasons} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-foreground">Clientes</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-white/70">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr>
                <th className={th}>Empresa</th>
                <th className={th}>Plano</th>
                <th className={th}>Saúde</th>
                <th className={th}>Classificação</th>
                <th className={th}>Visitas 30d (ant.)</th>
                <th className={th}>Contatos 30d</th>
                <th className={th}>Motivos</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 && (
                <tr>
                  <td className={td} colSpan={7}>
                    Nenhuma empresa aprovada.
                  </td>
                </tr>
              )}
              {customers.map((customer) => (
                <tr key={customer.businessId} className="border-t border-border">
                  <td className={td}>
                    <Link href={`/admin/empresas/${customer.businessId}`} className="tap font-medium text-primary underline">
                      {customer.name}
                    </Link>
                    <span className="block text-[13px] text-muted">{customer.category}</span>
                  </td>
                  <td className={td}>{customer.plan}</td>
                  <td className={td}>{customer.health.score}</td>
                  <td className={td}>
                    <Badge band={customer.health.band} label={CUSTOMER_BAND_LABEL[customer.health.band]} />
                  </td>
                  <td className={td}>
                    {customer.engagement.views} ({customer.engagement.prevViews})
                  </td>
                  <td className={td}>{customer.engagement.clicks}</td>
                  <td className={td}>
                    <Reasons reasons={customer.health.reasons} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
