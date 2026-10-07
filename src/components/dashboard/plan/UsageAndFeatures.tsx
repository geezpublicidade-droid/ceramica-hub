import Link from "next/link";
import { FEATURE_DEFINITIONS, FEATURE_GROUPS, type FeatureGroup, type FeatureMap, type PlanKey } from "@/lib/plans/features";
import { canAccess, diffFeatures, formatFeatureValue, lowestPlanWith, type UsageRow } from "@/lib/plans/resolve";

type Ladder = { key: PlanKey; name: string; features: FeatureMap }[];

const SHORT_LABEL: Record<string, string> = { services: "Serviços", gallery_images: "Galeria", active_promotions: "Promoções", featured_videos: "Vídeo em destaque" };
const UPGRADE_NOUN: Record<string, string> = { services: "serviços", gallery_images: "fotos", active_promotions: "promoções", featured_videos: "vídeos" };

function limitText(row: UsageRow): string {
  if (!Number.isFinite(row.limit)) return `${row.used} utilizados · ilimitado`;
  if (row.limit === 0) return "Não incluído no plano";
  return `${row.used} de ${row.limit} utilizados`;
}

/** Barras de uso x limite (“Serviços: 2 de 3 utilizados”) e o convite objetivo ao próximo plano. */
export function UsageMeters({ usage, features, plan, ladder }: { usage: UsageRow[]; features: FeatureMap; plan: PlanKey; ladder: Ladder }) {
  const current = ladder.findIndex((entry) => entry.key === plan);
  const next = ladder.slice(current + 1).find((entry) => diffFeatures(features, entry.features).gained.length > 0);
  const gained = next ? diffFeatures(features, next.features).gained : [];
  const numbers = gained.filter((change) => UPGRADE_NOUN[change.key]).map((change) => `${formatFeatureValue(change.key, change.to).toLowerCase()} ${UPGRADE_NOUN[change.key]}`);
  const extras = ["trackable_coupons", "lead_forms", "custom_hero", "tour_3d"].filter((key) => gained.some((change) => change.key === key));
  const EXTRA_LABEL: Record<string, string> = { trackable_coupons: "cupons rastreáveis", lead_forms: "formulário próprio", custom_hero: "landing page personalizada", tour_3d: "tour 3D" };

  return (
    <section className="glass-light rounded-3xl p-6">
      <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-muted">Uso do plano</p>
      <ul className="mt-4 space-y-4">
        {usage.map((row) => (
          <li key={row.key}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-[14.5px]">
              <span className="font-medium">{SHORT_LABEL[row.key] ?? row.label}</span>
              <span className={row.over ? "font-semibold text-red-700" : "text-muted"}>{limitText(row)}</span>
            </div>
            {Number.isFinite(row.limit) && row.limit > 0 && (
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/[0.07]" role="progressbar" aria-valuenow={Math.min(row.used, row.limit)} aria-valuemin={0} aria-valuemax={row.limit} aria-label={row.label}>
                <div className={`h-full rounded-full ${row.over ? "bg-red-500" : row.percent >= 100 ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${row.percent}%` }} />
              </div>
            )}
            {row.over && (
              <p className="mt-1 text-[13px] text-red-700">
                Você tem {row.used} salvos, mas o plano publica {row.limit}. Escolha abaixo o que fica no ar — nada foi apagado.
              </p>
            )}
          </li>
        ))}
      </ul>
      {next && (numbers.length > 0 || extras.length > 0) && (
        <p className="mt-5 rounded-xl bg-primary/5 px-4 py-3 text-[14.5px] leading-relaxed">
          Faça upgrade para o plano <strong>{next.name}</strong> e publique até {[...numbers, ...extras.map((key) => EXTRA_LABEL[key])].join(", ")}.{" "}
          <Link href={`/planos/${next.key}`} className="font-semibold text-primary hover:underline">
            Conhecer o plano →
          </Link>
        </p>
      )}
    </section>
  );
}

/** Todos os recursos agrupados: liberados (✓) e bloqueados (🔒 com o plano que os libera). */
export function FeatureAvailability({ features, ladder }: { features: FeatureMap; ladder: Ladder }) {
  const groups = (Object.keys(FEATURE_GROUPS) as FeatureGroup[]).filter((group) => group !== "sponsor" || FEATURE_DEFINITIONS.some((def) => def.group === "sponsor" && canAccess(features, def.key)));

  return (
    <section className="glass-light rounded-3xl p-6">
      <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-muted">Recursos do seu plano</p>
      <div className="mt-4 space-y-6">
        {groups.map((group) => (
          <div key={group}>
            <h3 className="text-[14px] font-semibold">{FEATURE_GROUPS[group]}</h3>
            <ul className="mt-2 grid gap-x-6 gap-y-1.5 text-[14px] sm:grid-cols-2">
              {FEATURE_DEFINITIONS.filter((def) => def.group === group && def.key !== "basic_page").map((def) => {
                const available = canAccess(features, def.key);
                const required = available ? null : lowestPlanWith(def.key, ladder);
                const requiredName = required ? ladder.find((entry) => entry.key === required)?.name : null;
                return (
                  <li key={def.key} className={`flex items-start gap-2 ${available ? "" : "text-muted"}`}>
                    <span aria-hidden="true" className={available ? "text-whatsapp" : ""}>{available ? "✓" : "🔒"}</span>
                    <span>
                      {def.label}
                      {def.kind !== "flag" && available && <span className="text-muted"> — {formatFeatureValue(def.key, features[def.key])}</span>}
                      {requiredName && <span className="block text-[12.5px]">Disponível no plano {requiredName}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
