import Link from "next/link";
import { requireAdminPage } from "@/lib/auth-guards";
import { getMarketingDashboard, DASHBOARD_WINDOW_DAYS } from "@/lib/services/marketing-dashboard";
import { CONTENT_STATUS_LABEL, type ContentStatus } from "@/lib/services/content-calendar";
import { formatDateBR } from "@/lib/utils";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminStatCard } from "@/components/admin/AdminStatCard";

export const metadata = { title: "Central de Marketing — Cerâmica Hub" };

const QUICK_LINKS = [
  { href: "/admin/marketing/campanhas", label: "Campanhas" },
  { href: "/admin/marketing/calendario", label: "Calendário" },
  { href: "/admin/marketing/publicos", label: "Públicos" },
  { href: "/admin/marketing/email", label: "E-mail marketing" },
  { href: "/admin/marketing/automacoes", label: "Automações" },
  { href: "/admin/publicidade/espacos", label: "Espaços publicitários" },
];

function StatSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[17px] font-semibold text-foreground">{title}</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
    </section>
  );
}

export default async function MarketingCenterPage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "marketing", "conteudo"]);
  const data = await getMarketingDashboard();
  const awaiting = data.campaignsAwaitingApproval + data.contentAwaitingApproval;

  return (
    <AdminShell currentPath="/admin/marketing" adminRole={adminRole} wide>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Central de Marketing</h1>
        <p className="mt-2 text-[16px] text-muted">
          Campanhas, conteúdo, e-mail e publicidade num só lugar. Números de envio, anúncios e leads dos últimos{" "}
          {DASHBOARD_WINDOW_DAYS} dias.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="neu rounded-full px-4 py-2 text-[14px] font-medium text-foreground">
            {link.label}
          </Link>
        ))}
      </div>

      <StatSection title="Campanhas e aprovações">
        <AdminStatCard label="Campanhas ativas" value={data.campaignsActive} />
        <AdminStatCard label="Campanhas programadas" value={data.campaignsScheduled} />
        <AdminStatCard label="Campanhas aguardando aprovação" value={data.campaignsAwaitingApproval} highlight={data.campaignsAwaitingApproval > 0} />
        <AdminStatCard label="Conteúdos aguardando aprovação" value={data.contentAwaitingApproval} highlight={awaiting > 0 && data.contentAwaitingApproval > 0} />
      </StatSection>

      <StatSection title="Resultados">
        <AdminStatCard label="E-mails enviados" value={data.emailsSent} />
        <AdminStatCard label="Aberturas / cliques em e-mail" value={`${data.emailOpens} / ${data.emailClicks}`} />
        <AdminStatCard label="Publicidades contratadas" value={data.adsContracted} />
        <AdminStatCard label="Visualizações / cliques em anúncios" value={`${data.adImpressions} / ${data.adClicks}`} />
        <AdminStatCard label="Leads gerados por campanhas" value={data.leads} />
      </StatSection>

      <section>
        <h2 className="text-[17px] font-semibold text-foreground">Próximas ações (14 dias)</h2>
        <div className="mt-3 flex flex-col gap-2">
          {data.upcoming.length === 0 && <p className="text-[15px] text-muted">Nada agendado nos próximos dias.</p>}
          {data.upcoming.map((item) => (
            <Link
              key={item.id}
              href={`/admin/marketing/calendario?mes=${item.scheduledFor.slice(0, 7)}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-white/70 px-4 py-3"
            >
              <span className="text-[15px] font-medium text-foreground">
                {item.title}
                {item.businessName && <span className="font-normal text-muted"> · {item.businessName}</span>}
              </span>
              <span className="text-[13px] text-muted">
                {formatDateBR(item.scheduledFor)} · {CONTENT_STATUS_LABEL[item.status as ContentStatus] ?? item.status}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
