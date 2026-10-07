import {
  DEFAULT_PLAN_DEFINITIONS,
  DEFAULT_PLAN_FEATURES,
  FEATURE_KEYS,
  FREE_PLAN,
  PLAN_FEATURE_FALLBACK,
  UNLIMITED,
  featureDefinition,
  normalizeFeatureKey,
  type FeatureKey,
  type FeatureMap,
  type FeatureValue,
  type PlanKey,
} from "./features.ts";

export const PLAN_STATUSES = ["active", "trialing", "pending", "past_due", "canceled", "expired", "suspended"] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  active: "Ativo",
  trialing: "Em teste",
  pending: "Aguardando pagamento",
  past_due: "Pagamento em atraso",
  canceled: "Cancelado",
  expired: "Expirado",
  suspended: "Suspenso",
};

export type BillingCycle = "free" | "monthly" | "yearly" | "courtesy" | "custom";

export type PlanState = {
  /** plano contratado (o que a empresa paga/ganhou), não necessariamente o que está valendo hoje */
  plan: PlanKey;
  status: PlanStatus;
  startedAt: string | null;
  expiresAt: string | null;
  /** última alteração do plano (âncora da tolerância quando não há vencimento) */
  updatedAt: string | null;
  /** cortesia/negociação manual: ignora vencimento e inadimplência (suspensão continua valendo) */
  manualOverride: boolean;
  trial?: { status: "none" | "active" | "expired"; plan: PlanKey | null; endsAt: string | null };
};

export type EffectiveReason =
  | "active"
  | "courtesy"
  | "trial"
  | "grace"
  | "canceled_until_expiry"
  | "free_pending"
  | "free_suspended"
  | "free_expired"
  | "free_canceled";

export type EffectivePlan = {
  /** plano cujos recursos estão valendo agora */
  plan: PlanKey;
  contractedPlan: PlanKey;
  reason: EffectiveReason;
  inGrace: boolean;
  graceEndsAt: string | null;
  /** dias até o vencimento (negativo = vencido); null sem vencimento */
  daysUntilExpiry: number | null;
  /** o plano contratado deixou de valer e a página voltou aos recursos gratuitos */
  downgraded: boolean;
};

export const DEFAULT_GRACE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const rankOf = (plan: PlanKey, ranks?: Record<PlanKey, number>): number =>
  ranks?.[plan] ?? DEFAULT_PLAN_DEFINITIONS.find((definition) => definition.key === plan)?.rank ?? 0;

type ResolveOptions = { now?: Date; graceDays?: number; ranks?: Record<PlanKey, number>; freePlan?: PlanKey };

function ms(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const value = new Date(iso).getTime();
  return Number.isNaN(value) ? null : value;
}

type Base = { plan: PlanKey; reason: EffectiveReason; inGrace?: boolean; graceEndsAt?: number | null };

function baseFor(state: PlanState, now: number, graceMs: number, free: PlanKey): Base {
  const { plan, status } = state;
  const expires = ms(state.expiresAt);

  if (status === "suspended") return { plan: free, reason: "free_suspended" };
  if (status === "pending") return { plan: free, reason: "free_pending" };
  if (status === "expired") return { plan: free, reason: "free_expired" };
  if (status === "canceled") {
    return expires !== null && expires > now ? { plan, reason: "canceled_until_expiry" } : { plan: free, reason: "free_canceled" };
  }
  if (state.manualOverride) return { plan, reason: "courtesy" };

  // active | trialing | past_due
  const anchor = expires ?? (status === "past_due" ? (ms(state.updatedAt) ?? ms(state.startedAt)) : null);
  if (anchor === null) return { plan, reason: "active" };
  if (status !== "past_due" && anchor > now) return { plan, reason: "active" };
  const graceEnd = anchor + graceMs;
  return now <= graceEnd ? { plan, reason: "grace", inGrace: true, graceEndsAt: graceEnd } : { plan: free, reason: "free_expired" };
}

/**
 * Qual plano está valendo agora. Regras: suspenso/pendente/expirado = gratuito; cancelado vale até o vencimento;
 * ativo, em teste ou atrasado vale até o vencimento + dias de tolerância; cortesia (manual) ignora vencimento;
 * um teste ativo sobe o plano temporariamente. Nada aqui apaga dado: só decide o que fica publicado.
 */
export function resolveEffectivePlan(state: PlanState, options: ResolveOptions = {}): EffectivePlan {
  const now = (options.now ?? new Date()).getTime();
  const graceMs = (options.graceDays ?? DEFAULT_GRACE_DAYS) * DAY_MS;
  const free = options.freePlan ?? FREE_PLAN;

  let base = baseFor(state, now, graceMs, free);
  const trialEnds = ms(state.trial?.endsAt);
  const trialActive = state.trial?.status === "active" && trialEnds !== null && trialEnds > now && Boolean(state.trial.plan);
  if (trialActive && state.status !== "suspended" && rankOf(state.trial!.plan!, options.ranks) > rankOf(base.plan, options.ranks)) {
    base = { plan: state.trial!.plan!, reason: "trial" };
  }

  const expires = ms(state.expiresAt);
  return {
    plan: base.plan,
    contractedPlan: state.plan,
    reason: base.reason,
    inGrace: Boolean(base.inGrace),
    graceEndsAt: base.graceEndsAt ? new Date(base.graceEndsAt).toISOString() : null,
    daysUntilExpiry: expires === null ? null : Math.ceil((expires - now) / DAY_MS),
    downgraded: base.plan !== state.plan && rankOf(base.plan, options.ranks) < rankOf(state.plan, options.ranks),
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Recursos
// ---------------------------------------------------------------------------------------------------------------

export type FeatureOverride = {
  featureKey: string;
  value: FeatureValue;
  startsAt?: string | null;
  expiresAt?: string | null;
};

/** Completa o mapa do plano com o padrão de fábrica nos recursos que ele não definiu (recurso novo, linha ausente). */
export function completeFeatures(partial: Partial<Record<string, FeatureValue>> | undefined, plan: PlanKey): FeatureMap {
  const defaults = (DEFAULT_PLAN_FEATURES as Record<string, FeatureMap>)[plan] ?? PLAN_FEATURE_FALLBACK;
  const out = { ...defaults } as FeatureMap;
  for (const key of FEATURE_KEYS) {
    const value = partial?.[key];
    if (value !== undefined && value !== null) out[key] = value;
  }
  return out;
}

function overrideActive(override: FeatureOverride, now: number): boolean {
  const starts = ms(override.startsAt);
  const ends = ms(override.expiresAt);
  return (starts === null || starts <= now) && (ends === null || ends > now);
}

/** Recursos efetivos: o plano em vigor + overrides ativos (o último da lista vence). */
export function resolveFeatures(
  planFeatures: Partial<Record<string, FeatureValue>> | undefined,
  plan: PlanKey,
  overrides: readonly FeatureOverride[] = [],
  now: Date = new Date(),
): FeatureMap {
  const features = completeFeatures(planFeatures, plan);
  for (const override of overrides) {
    const key = normalizeFeatureKey(override.featureKey);
    if (key && overrideActive(override, now.getTime())) features[key] = override.value;
  }
  return features;
}

/** Acesso ao recurso: flag ligada, limite diferente de zero ou enum fora do valor "desligado". */
export function canAccess(features: Readonly<FeatureMap>, key: string): boolean {
  const normalized = normalizeFeatureKey(key);
  if (!normalized) return false;
  const value = features[normalized];
  const def = featureDefinition(normalized);
  if (def?.kind === "enum") return !(def.offValues ?? []).includes(String(value));
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") return value === UNLIMITED;
  return value === true;
}

/** Limite numérico do recurso (Infinity = ilimitado; recurso ligado/desligado vira 0 ou Infinity). */
export function getLimit(features: Readonly<FeatureMap>, key: string): number {
  const normalized = normalizeFeatureKey(key);
  if (!normalized) return 0;
  const value = features[normalized];
  if (value === UNLIMITED) return Infinity;
  if (typeof value === "number") return value;
  return canAccess(features, normalized) ? Infinity : 0;
}

export function getFeatureValue(features: Readonly<FeatureMap>, key: string): FeatureValue | undefined {
  const normalized = normalizeFeatureKey(key);
  return normalized ? features[normalized] : undefined;
}

export function formatFeatureValue(key: FeatureKey, value: FeatureValue): string {
  const def = featureDefinition(key);
  if (value === UNLIMITED) return "Ilimitado";
  if (def?.kind === "flag") return value === true ? "Incluído" : "Não incluído";
  if (def?.kind === "limit") return value === 0 ? "Não incluído" : String(value);
  return String(value);
}

export type FeatureChange = { key: FeatureKey; from: FeatureValue; to: FeatureValue };
export type FeatureDiff = { gained: FeatureChange[]; lost: FeatureChange[]; changed: FeatureChange[] };

const rankValue = (features: Readonly<FeatureMap>, key: FeatureKey): number => (canAccess(features, key) ? getLimit(features, key) : -1);

/** Diferença entre dois mapas de recursos: o que passa a existir, o que deixa de existir e o que só muda de quantidade. */
export function diffFeatures(from: Readonly<FeatureMap>, to: Readonly<FeatureMap>): FeatureDiff {
  const diff: FeatureDiff = { gained: [], lost: [], changed: [] };
  for (const key of FEATURE_KEYS) {
    if (from[key] === to[key]) continue;
    const change: FeatureChange = { key, from: from[key], to: to[key] };
    const before = rankValue(from, key);
    const after = rankValue(to, key);
    if (before === after && canAccess(from, key) === canAccess(to, key)) diff.changed.push(change);
    else if (!canAccess(from, key) && canAccess(to, key)) diff.gained.push(change);
    else if (canAccess(from, key) && !canAccess(to, key)) diff.lost.push(change);
    else (after > before ? diff.gained : diff.lost).push(change);
  }
  return diff;
}

// ---------------------------------------------------------------------------------------------------------------
// Conteúdo publicado x limite (downgrade sem apagar nada)
// ---------------------------------------------------------------------------------------------------------------

/** Itens que ficam no ar: só os ativos, até o limite do plano, na ordem recebida. O excedente continua salvo (inativo). */
export function publishedItems<T extends object>(items: readonly T[], limit: number): T[] {
  const active = items.filter((item) => (item as { active?: boolean }).active !== false);
  return Number.isFinite(limit) ? active.slice(0, Math.max(0, limit)) : active;
}

export type UsageRow = { key: FeatureKey; label: string; used: number; limit: number; remaining: number; over: boolean; percent: number };

export const USAGE_FEATURES: readonly FeatureKey[] = ["services", "gallery_images", "active_promotions", "featured_videos"];

/** Uso x limite dos recursos contáveis (`counts` = itens ativos hoje). */
export function computeUsage(features: Readonly<FeatureMap>, counts: Partial<Record<FeatureKey, number>>): UsageRow[] {
  return USAGE_FEATURES.map((key) => {
    const used = counts[key] ?? 0;
    const limit = getLimit(features, key);
    const finite = Number.isFinite(limit);
    return {
      key,
      label: featureDefinition(key)?.label ?? key,
      used,
      limit,
      remaining: finite ? Math.max(0, limit - used) : Infinity,
      over: finite && used > limit,
      percent: finite ? (limit === 0 ? (used > 0 ? 100 : 0) : Math.min(100, Math.round((used / limit) * 100))) : 0,
    };
  });
}

/** Primeiro plano da escada que libera o recurso (para "Disponível no plano X"). `ladder` = planos ordenados do mais barato ao mais caro. */
export function lowestPlanWith(key: string, ladder: readonly { key: PlanKey; features: Readonly<FeatureMap> }[]): PlanKey | null {
  return ladder.find((plan) => canAccess(plan.features, key))?.key ?? null;
}
