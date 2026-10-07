import { FEATURE_DEFINITIONS, type FeatureMap, type PlanKey } from "@/lib/plans/features";
import { canAccess, formatFeatureValue } from "@/lib/plans/resolve";
import type { PlanHistoryEntry } from "@/lib/services/company-plan";
import { formatDateBR } from "@/lib/utils";

const KIND_LABEL: Record<string, string> = {
  baseline: "Plano inicial",
  upgrade: "Upgrade",
  downgrade: "Mudança para plano inferior",
  plan_change: "Troca de plano",
  renewal: "Renovação",
  payment: "Pagamento confirmado",
  trial_start: "Teste iniciado",
  trial_end: "Teste encerrado",
  suspend: "Plano suspenso",
  reactivate: "Plano reativado",
  cancel: "Plano cancelado",
  courtesy: "Cortesia concedida",
  override_set: "Recurso liberado manualmente",
  override_removed: "Recurso personalizado removido",
  status_change: "Mudança de status",
  auto_downgrade: "Plano expirado (automático)",
  auto_expire: "Plano expirado (automático)",
  dates_change: "Alteração de datas",
  discount: "Desconto aplicado",
  note: "Observação",
};

/** Histórico da assinatura visível para a empresa (sem notas internas do admin). */
export function PlanHistoryList({ history, planNames }: { history: PlanHistoryEntry[]; planNames: Record<PlanKey, string> }) {
  const visible = history.filter((entry) => entry.kind !== "note");
  if (visible.length === 0) return null;
  return (
    <section className="glass-light rounded-3xl p-6">
      <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-muted">Histórico da assinatura</p>
      <ol className="mt-4 space-y-3">
        {visible.slice(0, 15).map((entry) => (
          <li key={entry.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3 text-[14.5px] last:border-0 last:pb-0">
            <span>
              <strong>{KIND_LABEL[entry.kind] ?? entry.kind}</strong>
              {entry.fromPlan && entry.toPlan && entry.fromPlan !== entry.toPlan && (
                <span className="text-muted">
                  {" "}
                  — {planNames[entry.fromPlan] ?? entry.fromPlan} → {planNames[entry.toPlan] ?? entry.toPlan}
                </span>
              )}
              {entry.reason && <span className="block text-[13px] text-muted">{entry.reason}</span>}
            </span>
            <span className="text-[13px] text-muted">{formatDateBR(entry.effectiveAt)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

type Ladder = { key: PlanKey; name: string; features: FeatureMap }[];

const COMPARE_KEYS = [
  "services", "gallery_images", "active_promotions", "trackable_coupons", "featured_videos", "whatsapp", "social_media", "business_hours",
  "custom_hero", "custom_sections", "faq", "lead_forms", "tour_3d", "category_priority", "search_priority", "rotating_card", "metrics_basic", "metrics_full", "metrics_premium",
] as const;

/** Quadro comparativo de planos montado direto da matriz (nunca desatualiza em relação ao que o sistema libera). */
export function PlanComparisonTable({ ladder, currentPlan }: { ladder: Ladder; currentPlan: PlanKey }) {
  const defs = COMPARE_KEYS.map((key) => FEATURE_DEFINITIONS.find((def) => def.key === key)!);
  return (
    <section className="glass-light overflow-x-auto rounded-3xl p-6">
      <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-muted">Comparação dos planos</p>
      <table className="mt-4 w-full min-w-[680px] border-collapse text-left text-[13.5px]">
        <thead>
          <tr className="border-b border-border">
            <th className="py-2 pr-3 font-medium text-muted">Recurso</th>
            {ladder.map((plan) => (
              <th key={plan.key} scope="col" className={`px-2 py-2 text-center ${plan.key === currentPlan ? "bg-primary/5" : ""}`}>
                {plan.name}
                {plan.key === currentPlan && <span className="block text-[11px] font-medium text-primary">seu plano</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {defs.map((def) => (
            <tr key={def.key} className="border-b border-border/60">
              <th scope="row" className="py-2 pr-3 font-normal text-foreground/80">
                {def.label}
              </th>
              {ladder.map((plan) => {
                const available = canAccess(plan.features, def.key);
                return (
                  <td key={plan.key} className={`px-2 py-2 text-center ${plan.key === currentPlan ? "bg-primary/5" : ""}`}>
                    {!available ? <span className="text-muted" aria-label="Não incluído">—</span> : def.kind === "flag" ? <span className="font-semibold text-whatsapp" aria-label="Incluído">✓</span> : <span className="font-medium">{formatFeatureValue(def.key, plan.features[def.key])}</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
