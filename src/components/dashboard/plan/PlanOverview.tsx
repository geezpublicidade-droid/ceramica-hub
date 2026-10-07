import Link from "next/link";
import { PLAN_STATUS_LABELS } from "@/lib/plans/resolve";
import type { CompanyPermissions } from "@/lib/services/company-plan";
import { formatDateBR } from "@/lib/utils";

const TONE: Record<string, string> = {
  active: "bg-whatsapp/10 text-whatsapp",
  trialing: "bg-sky-100 text-sky-800",
  pending: "bg-amber-100 text-amber-800",
  past_due: "bg-red-100 text-red-800",
  canceled: "bg-black/5 text-muted",
  expired: "bg-red-100 text-red-800",
  suspended: "bg-red-100 text-red-800",
};

const CYCLE_LABEL: Record<string, string> = { free: "Gratuito", monthly: "Mensal", yearly: "Anual", courtesy: "Cortesia", custom: "Negociado" };

function Banner({ tone, children }: { tone: "warn" | "danger" | "info"; children: React.ReactNode }) {
  const styles = { warn: "border-amber-200 bg-amber-50 text-amber-900", danger: "border-red-200 bg-red-50 text-red-900", info: "border-sky-200 bg-sky-50 text-sky-900" }[tone];
  return <p role="status" className={`rounded-xl border px-4 py-3 text-[14.5px] leading-relaxed ${styles}`}>{children}</p>;
}

/** Plano atual, status, renovação e os avisos que importam (vencimento próximo, tolerância, plano reduzido). */
export function PlanOverview({ permissions }: { permissions: CompanyPermissions }) {
  const { effective } = permissions;
  const days = effective.daysUntilExpiry;
  const expiringSoon = days !== null && days >= 0 && days <= 7 && !permissions.manualOverride && permissions.status === "active";

  return (
    <section className="glass-light rounded-3xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-muted">Seu plano</p>
          <h2 className="mt-1 text-[28px] font-semibold tracking-tight">{permissions.planName}</h2>
          {permissions.planName !== permissions.contractedPlanName && (
            <p className="mt-0.5 text-[13.5px] text-muted">Plano contratado: {permissions.contractedPlanName}</p>
          )}
        </div>
        <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${TONE[permissions.status] ?? TONE.active}`}>{PLAN_STATUS_LABELS[permissions.status]}</span>
      </div>

      <dl className="mt-5 grid gap-x-8 gap-y-3 text-[14.5px] sm:grid-cols-3">
        <div>
          <dt className="text-muted">Renovação</dt>
          <dd className="font-medium">
            {permissions.manualOverride ? "Sem vencimento (cortesia)" : permissions.expiresAt ? formatDateBR(permissions.expiresAt) : "Sem vencimento"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Ciclo</dt>
          <dd className="font-medium">{CYCLE_LABEL[permissions.billingCycle] ?? permissions.billingCycle}</dd>
        </div>
        <div>
          <dt className="text-muted">Desconto negociado</dt>
          <dd className="font-medium">{permissions.discountPercent ? `${permissions.discountPercent}%` : "—"}</dd>
        </div>
      </dl>

      <div className="mt-5 space-y-3">
        {expiringSoon && (
          <Banner tone="warn">
            Seu plano vence {days === 0 ? "hoje" : `em ${days} dia${days === 1 ? "" : "s"}`}. Renove para manter todos os recursos.
          </Banner>
        )}
        {effective.inGrace && (
          <Banner tone="danger">
            Pagamento em atraso. Seus recursos continuam ativos até {effective.graceEndsAt ? formatDateBR(effective.graceEndsAt) : "o fim da tolerância"}; depois disso a página volta aos recursos do plano gratuito. Nenhum conteúdo é apagado.
          </Banner>
        )}
        {effective.downgraded && !effective.inGrace && (
          <Banner tone="danger">
            Seu plano {permissions.contractedPlanName} não está ativo, então a página pública usa os recursos do plano {permissions.planName}. Todo o seu conteúdo continua salvo e volta a ser publicado assim que o plano for regularizado.
          </Banner>
        )}
        {permissions.status === "trialing" || effective.reason === "trial" ? <Banner tone="info">Você está em período de teste dos recursos do plano {permissions.planName}.</Banner> : null}
        {permissions.status === "pending" && <Banner tone="info">Aguardando a confirmação do pagamento. Assim que for confirmado, os recursos são liberados automaticamente.</Banner>}
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-[14px]">
        <Link href="/planos" target="_blank" className="font-semibold text-primary hover:underline">
          Comparar planos →
        </Link>
        <Link href="/dashboard/suporte" className="font-semibold text-primary hover:underline">
          Falar com o suporte →
        </Link>
      </div>
    </section>
  );
}
