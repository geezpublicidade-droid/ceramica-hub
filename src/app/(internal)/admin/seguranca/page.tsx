import Link from "next/link";
import { requireAdminPage } from "@/lib/auth-guards";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AUDIT_PAGE_SIZE,
  AUDIT_VIEWS,
  AUDIT_VIEW_LABEL,
  getAccessLog,
  getAuditTrail,
  isAuditView,
  type AuditView,
} from "@/lib/services/audit-trail";
import { EXPORT_TABLES, EXPORT_TABLE_LABEL } from "@/lib/services/data-export";
import { getSuspiciousActivity } from "@/lib/services/security-alerts";

export const metadata = { title: "Segurança e auditoria — Cerâmica Hub" };
export const dynamic = "force-dynamic";

const th = "px-3 py-2 text-left text-[13px] font-medium text-muted";
const td = "px-3 py-2 align-top text-[14px] text-foreground";
const formatDate = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

type SearchParams = { view?: string; pagina?: string };

async function AuditTable({ view, page }: { view: AuditView; page: number }) {
  const href = (target: number) => `/admin/seguranca?view=${view}&pagina=${target}`;
  const result = view === "acessos" ? await getAccessLog(page) : await getAuditTrail(view, page);
  const lastPage = Math.max(0, Math.ceil(result.total / AUDIT_PAGE_SIZE) - 1);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-2xl border border-border bg-white/70">
        <table className="w-full">
          <thead>
            {view === "acessos" ? (
              <tr><th className={th}>Quando</th><th className={th}>Conta</th><th className={th}>IP</th><th className={th}>Resultado</th></tr>
            ) : (
              <tr><th className={th}>Quando</th><th className={th}>Quem</th><th className={th}>Ação</th><th className={th}>Item</th><th className={th}>Detalhes</th></tr>
            )}
          </thead>
          <tbody>
            {view === "acessos"
              ? (result.rows as Awaited<ReturnType<typeof getAccessLog>>["rows"]).map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className={td}>{formatDate(row.at)}</td>
                    <td className={td}>{row.identifier}</td>
                    <td className={td}>{row.ip ?? "—"}</td>
                    <td className={td}>{row.success ? "Sucesso" : "Falha"}</td>
                  </tr>
                ))
              : (result.rows as Awaited<ReturnType<typeof getAuditTrail>>["rows"]).map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className={td}>{formatDate(row.at)}</td>
                    <td className={td}>{row.actorLabel}</td>
                    <td className={td}>{row.action}</td>
                    <td className={td}>{row.entityType}</td>
                    <td className={`${td} break-all text-[13px] text-muted`}>{row.details || "—"}</td>
                  </tr>
                ))}
            {result.rows.length === 0 && (
              <tr><td colSpan={5} className={`${td} text-muted`}>Nada registrado ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3 text-[14px]">
        {page > 0 && <Link href={href(page - 1)} className="neu rounded-full px-3 py-1.5 text-foreground">← Mais recentes</Link>}
        <span className="text-muted">Página {page + 1} de {lastPage + 1} · {result.total} registros</span>
        {page < lastPage && <Link href={href(page + 1)} className="neu rounded-full px-3 py-1.5 text-foreground">Mais antigos →</Link>}
      </div>
    </div>
  );
}

export default async function SecurityPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { adminRole } = await requireAdminPage(["super_admin", "admin"]);
  const params = await searchParams;
  const view: AuditView = isAuditView(params.view) ? params.view : "historico";
  const page = Math.max(0, Number.parseInt(params.pagina ?? "0", 10) || 0);
  const alerts = await getSuspiciousActivity();

  return (
    <AdminShell currentPath="/admin/seguranca" adminRole={adminRole} wide>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Segurança e auditoria</h1>
        <p className="mt-2 text-[16px] text-muted">Quem fez o quê, acessos, exportações e alertas das últimas 24 horas.</p>
      </div>

      <section className="rounded-2xl border border-border bg-white/70 p-5">
        <h2 className="text-[18px] font-semibold text-foreground">Alertas (24 h)</h2>
        {alerts.length === 0 ? (
          <p className="mt-2 text-[14px] text-muted">Nenhuma atividade suspeita detectada.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {alerts.map((alert) => (
              <li key={alert.key} className={`rounded-xl px-3 py-2 text-[14px] ${alert.severity === "danger" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                {alert.message}
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav className="flex flex-wrap gap-2 text-[14px]">
        {AUDIT_VIEWS.map((item) => (
          <Link key={item} href={`/admin/seguranca?view=${item}`} className={`rounded-full px-3 py-1.5 ${item === view ? "bg-primary text-white" : "neu text-foreground"}`}>
            {AUDIT_VIEW_LABEL[item]}
          </Link>
        ))}
      </nav>

      <AuditTable view={view} page={page} />

      <section className="rounded-2xl border border-border bg-white/70 p-5">
        <h2 className="text-[18px] font-semibold text-foreground">Exportar dados (backup e LGPD)</h2>
        <p className="mt-2 text-[14px] text-muted">Cada download fica registrado. Senhas, tokens e segredos nunca saem na exportação.</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {EXPORT_TABLES.map((table) => (
            <li key={table} className="flex items-center justify-between gap-3 text-[14px]">
              <span className="text-foreground">{EXPORT_TABLE_LABEL[table]}</span>
              <span className="flex gap-3">
                <a href={`/api/admin/export/${table}?format=csv`} className="font-medium text-primary underline">CSV</a>
                <a href={`/api/admin/export/${table}?format=json`} className="font-medium text-primary underline">JSON</a>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </AdminShell>
  );
}
