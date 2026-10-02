import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { formatDateTimeBR } from "@/lib/utils";
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

type SearchParams = { view?: string; pagina?: string };

function TableFrame({ head, empty, colSpan, children }: { head: string[]; empty: boolean; colSpan: number; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-white/70">
      <table className="w-full">
        <thead>
          <tr>{head.map((label) => <th key={label} className={th}>{label}</th>)}</tr>
        </thead>
        <tbody>
          {children}
          {empty && <tr><td colSpan={colSpan} className={`${td} text-muted`}>Nada registrado ainda.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function Pager({ view, page, total }: { view: AuditView; page: number; total: number }) {
  const lastPage = Math.max(0, Math.ceil(total / AUDIT_PAGE_SIZE) - 1);
  const href = (target: number) => `/admin/seguranca?view=${view}&pagina=${target}`;
  return (
    <div className="flex items-center gap-3 text-[14px]">
      {page > 0 && <Link href={href(page - 1)} className="neu rounded-full px-3 py-1.5 text-foreground">← Mais recentes</Link>}
      <span className="text-muted">Página {page + 1} de {lastPage + 1} · {total} registros</span>
      {page < lastPage && <Link href={href(page + 1)} className="neu rounded-full px-3 py-1.5 text-foreground">Mais antigos →</Link>}
    </div>
  );
}

async function AccessTable({ page }: { page: number }) {
  const { rows, total } = await getAccessLog(page);
  return (
    <div className="space-y-3">
      <TableFrame head={["Quando", "Conta", "IP", "Resultado"]} empty={rows.length === 0} colSpan={4}>
        {rows.map((row) => (
          <tr key={row.id} className="border-t border-border">
            <td className={td}>{formatDateTimeBR(row.at)}</td>
            <td className={td}>{row.identifier}</td>
            <td className={td}>{row.ip ?? "—"}</td>
            <td className={td}>{row.success ? "Sucesso" : "Falha"}</td>
          </tr>
        ))}
      </TableFrame>
      <Pager view="acessos" page={page} total={total} />
    </div>
  );
}

async function TrailTable({ view, page }: { view: Exclude<AuditView, "acessos">; page: number }) {
  const { rows, total } = await getAuditTrail(view, page);
  return (
    <div className="space-y-3">
      <TableFrame head={["Quando", "Quem", "Ação", "Item", "Detalhes"]} empty={rows.length === 0} colSpan={5}>
        {rows.map((row) => (
          <tr key={row.id} className="border-t border-border">
            <td className={td}>{formatDateTimeBR(row.at)}</td>
            <td className={td}>{row.actorLabel}</td>
            <td className={td}>{row.action}</td>
            <td className={td}>{row.entityType}</td>
            <td className={`${td} break-all text-[13px] text-muted`}>{row.details || "—"}</td>
          </tr>
        ))}
      </TableFrame>
      <Pager view={view} page={page} total={total} />
    </div>
  );
}

async function Alerts() {
  const alerts = await getSuspiciousActivity();
  return (
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
  );
}

export default async function SecurityPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { adminRole } = await requireAdminPage(["super_admin", "admin"]);
  const params = await searchParams;
  const view: AuditView = isAuditView(params.view) ? params.view : "historico";
  const page = Math.max(0, Number.parseInt(params.pagina ?? "0", 10) || 0);

  return (
    <AdminShell currentPath="/admin/seguranca" adminRole={adminRole} wide>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Segurança e auditoria</h1>
        <p className="mt-2 text-[16px] text-muted">Quem fez o quê, acessos, exportações e alertas das últimas 24 horas.</p>
      </div>

      <Suspense fallback={<p className="text-[14px] text-muted">Verificando alertas…</p>}>
        <Alerts />
      </Suspense>

      <nav className="flex flex-wrap gap-2 text-[14px]">
        {AUDIT_VIEWS.map((item) => (
          <Link key={item} href={`/admin/seguranca?view=${item}`} className={`rounded-full px-3 py-1.5 ${item === view ? "bg-primary text-white" : "neu text-foreground"}`}>
            {AUDIT_VIEW_LABEL[item]}
          </Link>
        ))}
      </nav>

      {view === "acessos" ? <AccessTable page={page} /> : <TrailTable view={view} page={page} />}

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
