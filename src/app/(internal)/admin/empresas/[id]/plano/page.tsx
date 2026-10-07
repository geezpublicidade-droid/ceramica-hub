import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { requireAdminPage } from "@/lib/auth-guards";
import { createServiceClient } from "@/lib/supabase/server";
import { getBusinessById, UUID_RE } from "@/lib/services/platform";
import { getCompanyPermissions, getContentUsage, getPlanHistory } from "@/lib/services/company-plan";
import { loadPlanCatalog } from "@/lib/services/plan-catalog";
import { computeUsage, PLAN_STATUS_LABELS } from "@/lib/plans/resolve";
import { FEATURE_DEFINITIONS } from "@/lib/plans/features";
import { AdminShell } from "@/components/admin/AdminShell";
import { ChangePlanPanel } from "@/components/admin/plan/ChangePlanPanel";
import { QuickActionsPanel } from "@/components/admin/plan/QuickActionsPanel";
import { OverridesPanel, SponsorPanel } from "@/components/admin/plan/OverridesAndSponsorPanel";
import { DeliverablesPanel, type DeliverableRow } from "@/components/admin/plan/DeliverablesPanel";
import { formatDateBR } from "@/lib/utils";

export const metadata = { title: "Plano da empresa — Cerâmica Hub" };
export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  baseline: "Estado inicial", upgrade: "Upgrade", downgrade: "Downgrade", plan_change: "Troca de plano", renewal: "Renovação", payment: "Pagamento",
  trial_start: "Teste iniciado", trial_end: "Teste encerrado", suspend: "Suspensão", reactivate: "Reativação", cancel: "Cancelamento", courtesy: "Cortesia",
  override_set: "Recurso personalizado", override_removed: "Recurso removido", status_change: "Status", auto_downgrade: "Expiração automática", auto_expire: "Expiração automática",
  dates_change: "Datas", discount: "Desconto", note: "Observação",
};

export default async function AdminCompanyPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "financeiro", "comercial"]);
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const [business, permissions, catalog, session] = await Promise.all([getBusinessById(id), getCompanyPermissions(id), loadPlanCatalog({ fresh: true }), auth()]);
  if (!business || !permissions) notFound();

  const supabase = createServiceClient();
  const [usageCounts, history, deliverablesResult] = await Promise.all([
    getContentUsage(id),
    getPlanHistory(id, 100),
    supabase.from("company_plan_deliverables").select("id, kind, title, status, scheduled_for, delivered_at, notes").eq("business_id", id).order("created_at", { ascending: false }),
  ]);
  const usage = computeUsage(permissions.features, usageCounts);
  const planNames = Object.fromEntries(catalog.plans.map((plan) => [plan.key, plan.name]));
  const plans = catalog.plans.filter((plan) => plan.active || plan.key === permissions.contractedPlan).sort((a, b) => a.rank - b.rank).map((plan) => ({ key: plan.key, name: plan.name }));
  const deliverables: DeliverableRow[] = (deliverablesResult.data ?? []).map((row) => ({ id: row.id, kind: row.kind, title: row.title, status: row.status, scheduledFor: row.scheduled_for, deliveredAt: row.delivered_at, notes: row.notes }));
  const adminName = session?.user?.name ?? session?.user?.email ?? "Administrador";
  const overrides = permissions.overrides.map((item) => ({ id: item.id, featureKey: item.featureKey, value: item.value, reason: item.reason, startsAt: item.startsAt ?? null, expiresAt: item.expiresAt ?? null }));
  const isSponsor = permissions.contractedPlan === "patrocinador";

  return (
    <AdminShell currentPath="/admin/empresas" adminRole={adminRole} wide>
      <div>
        <p className="text-[13px] font-medium uppercase tracking-wide text-muted">
          <Link href="/admin/empresas" className="text-primary underline">Empresas</Link> /{" "}
          <Link href={`/admin/empresas/${id}`} className="text-primary underline">{business.name}</Link> / Plano
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Plano — {business.name}</h1>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[14px]">
          <Link href={`/admin/empresas/${id}/landing`} className="font-medium text-primary hover:underline">Editar landing page →</Link>
          <Link href={`/empresa/${business.slug}/preview`} target="_blank" className="font-medium text-primary hover:underline">Pré-visualizar página →</Link>
          <Link href="/admin/planos" className="font-medium text-primary hover:underline">Catálogo de planos →</Link>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-medium uppercase tracking-wide text-muted">Em vigor agora</p>
            <p className="mt-1 text-[26px] font-semibold tracking-tight">{permissions.planName}</p>
            {permissions.contractedPlan !== permissions.plan && <p className="text-[13.5px] text-muted">Contratado: {permissions.contractedPlanName} — não está valendo ({permissions.effective.reason.replace(/_/g, " ")}).</p>}
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-[13px] font-semibold text-primary">{PLAN_STATUS_LABELS[permissions.status]}</span>
        </div>
        <dl className="mt-4 grid gap-x-8 gap-y-2 text-[14px] sm:grid-cols-4">
          <div><dt className="text-muted">Início</dt><dd className="font-medium">{permissions.startedAt ? formatDateBR(permissions.startedAt) : "—"}</dd></div>
          <div><dt className="text-muted">Vencimento</dt><dd className="font-medium">{permissions.manualOverride ? "Sem vencimento (cortesia)" : permissions.expiresAt ? formatDateBR(permissions.expiresAt) : "—"}</dd></div>
          <div><dt className="text-muted">Tolerância</dt><dd className="font-medium">{catalog.graceDays} dia(s){permissions.effective.inGrace ? " — em tolerância" : ""}</dd></div>
          <div><dt className="text-muted">Desconto</dt><dd className="font-medium">{permissions.discountPercent ? `${permissions.discountPercent}%` : "—"}</dd></div>
        </dl>
        {permissions.notes && <p className="mt-3 rounded-lg bg-black/[0.03] px-3 py-2 text-[14px]">Observação interna: {permissions.notes}</p>}
      </section>

      <ChangePlanPanel
        businessId={id}
        businessName={business.name}
        plans={plans}
        adminName={adminName}
        current={{ plan: permissions.contractedPlan, planName: permissions.contractedPlanName, status: permissions.status, startedAt: permissions.startedAt, expiresAt: permissions.expiresAt, billingCycle: permissions.billingCycle, manualOverride: permissions.manualOverride, discountPercent: permissions.discountPercent }}
      />
      <QuickActionsPanel businessId={id} plans={plans} status={permissions.status} discountPercent={permissions.discountPercent} notes={permissions.notes} ownerValidated={permissions.ownerValidated} trialActive={business.trial.status === "active"} />
      {isSponsor && <SponsorPanel businessId={id} overrides={overrides} />}
      <OverridesPanel businessId={id} overrides={overrides} />

      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="text-[17px] font-semibold">Uso e limites restantes</h2>
        <table className="mt-3 w-full text-left text-[14px]">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="py-2 font-medium">Recurso</th>
              <th className="py-2 font-medium">Usado</th>
              <th className="py-2 font-medium">Limite</th>
              <th className="py-2 font-medium">Restante</th>
            </tr>
          </thead>
          <tbody>
            {usage.map((row) => (
              <tr key={row.key} className="border-b border-border/60">
                <td className="py-2">{row.label}</td>
                <td className="py-2">{row.used}</td>
                <td className="py-2">{Number.isFinite(row.limit) ? row.limit : "Ilimitado"}</td>
                <td className={`py-2 ${row.over ? "font-semibold text-red-700" : ""}`}>{row.over ? `${row.used - row.limit} acima do limite (salvos, ocultos)` : Number.isFinite(row.remaining) ? row.remaining : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[13px] text-muted">Recursos ativos hoje: {FEATURE_DEFINITIONS.filter((def) => def.kind === "flag" && permissions.features[def.key] === true).length} de {FEATURE_DEFINITIONS.filter((def) => def.kind === "flag").length} liberações.</p>
      </section>

      <DeliverablesPanel businessId={id} deliverables={deliverables} />

      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="text-[17px] font-semibold">Histórico de alterações</h2>
        <ol className="mt-3 divide-y divide-border text-[14px]">
          {history.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
              <span>
                <strong>{KIND_LABEL[entry.kind] ?? entry.kind}</strong>
                {entry.fromPlan !== entry.toPlan && entry.fromPlan && entry.toPlan && <span className="text-muted"> — {planNames[entry.fromPlan] ?? entry.fromPlan} → {planNames[entry.toPlan] ?? entry.toPlan}</span>}
                {entry.fromStatus !== entry.toStatus && entry.toStatus && <span className="text-muted"> — {entry.fromStatus ? PLAN_STATUS_LABELS[entry.fromStatus] : "—"} → {PLAN_STATUS_LABELS[entry.toStatus]}</span>}
                {entry.reason && <span className="block text-[13px] text-muted">{entry.reason}</span>}
              </span>
              <span className="text-[13px] text-muted">{formatDateBR(entry.effectiveAt)} · {entry.changedByType === "admin" ? "admin" : entry.changedByType === "system" ? "sistema" : "empresa"}</span>
            </li>
          ))}
        </ol>
      </section>
    </AdminShell>
  );
}
