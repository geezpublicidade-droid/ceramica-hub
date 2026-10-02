import { createServiceClient } from "@/lib/supabase/server";
import { PLAN_PRICES_CENTS, type PayablePlan } from "@/lib/plan-limits";
import { GOAL_METRICS, monthWindow, previousMonth, type GoalMetric } from "@/lib/services/executive-goals";

type Supabase = ReturnType<typeof createServiceClient>;

const head = { count: "exact", head: true } as const;
const isoDate = (iso: string) => iso.slice(0, 10);

/** Receita contabilizada = faturas pagas, na data em que o admin confirmou o pagamento. */
async function paidInvoices(supabase: Supabase, from: string, to: string) {
  const { data, error } = await supabase
    .from("invoices")
    .select("amount_cents")
    .eq("status", "paid")
    .gte("confirmed_at", from)
    .lt("confirmed_at", to);
  if (error) throw error;
  const rows = data ?? [];
  return { cents: rows.reduce((sum, row) => sum + row.amount_cents, 0), count: rows.length };
}

async function countRows(query: PromiseLike<{ count: number | null; error: unknown }>): Promise<number> {
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

function planPrice(plan: string): number {
  return PLAN_PRICES_CENTS[plan as PayablePlan] ?? 0;
}

type SubscriptionRow = { id: string; business_id: string; plan: string; status: string; ends_at: string | null };

async function subscriptionsByStatus(supabase: Supabase, status: string): Promise<SubscriptionRow[]> {
  const { data, error } = await supabase.from("subscriptions").select("id, business_id, plan, status, ends_at").eq("status", status);
  if (error) throw error;
  return data ?? [];
}

/** Receita recorrente mensal: soma do preço de tabela dos planos com assinatura ativa. */
async function recurringRevenue(supabase: Supabase) {
  const active = await subscriptionsByStatus(supabase, "active");
  return { mrrCents: active.reduce((sum, sub) => sum + planPrice(sub.plan), 0), activeSubscriptions: active.length };
}

/** Inadimplência: assinaturas em atraso e o valor mensal que deixou de entrar. */
async function delinquency(supabase: Supabase) {
  const pastDue = await subscriptionsByStatus(supabase, "past_due");
  return { count: pastDue.length, cents: pastDue.reduce((sum, sub) => sum + planPrice(sub.plan), 0) };
}

async function businessesByPlan(supabase: Supabase): Promise<Record<string, number>> {
  const { data, error } = await supabase.from("businesses").select("plan").eq("status", "approved");
  if (error) throw error;
  const byPlan: Record<string, number> = {};
  for (const row of data ?? []) byPlan[row.plan] = (byPlan[row.plan] ?? 0) + 1;
  return byPlan;
}

/** Renovação: das assinaturas que terminaram no mês, quantas a empresa continuou com outra assinatura ativa. */
async function renewal(supabase: Supabase, from: string, to: string) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, business_id, ends_at")
    .gte("ends_at", from)
    .lt("ends_at", to);
  if (error) throw error;
  const ended = data ?? [];
  if (ended.length === 0) return { due: 0, renewed: 0 };

  const { data: active, error: activeError } = await supabase
    .from("subscriptions")
    .select("id, business_id, ends_at")
    .eq("status", "active")
    .in("business_id", ended.map((sub) => sub.business_id));
  if (activeError) throw activeError;

  const renewed = ended.filter((sub) =>
    (active ?? []).some((other) => other.business_id === sub.business_id && other.id !== sub.id && (other.ends_at ?? "") > sub.ends_at)
  );
  return { due: ended.length, renewed: renewed.length };
}

/** Cancelamentos: assinaturas canceladas ou expiradas cujo fim caiu no mês (não há data de cancelamento própria). */
function churned(supabase: Supabase, from: string, to: string) {
  return countRows(
    supabase.from("subscriptions").select("id", head).in("status", ["canceled", "expired"]).gte("ends_at", from).lt("ends_at", to)
  );
}

/** Espaços vendidos: campanhas de anúncio no ar hoje contra a capacidade total dos espaços. */
async function adOccupancy(supabase: Supabase) {
  const today = isoDate(new Date().toISOString());
  const [placements, live] = await Promise.all([
    supabase.from("ad_placements").select("max_concurrent"),
    supabase
      .from("ad_campaigns")
      .select("id", head)
      .in("status", ["approved", "scheduled", "active"])
      .lte("starts_at", today)
      .gte("ends_at", today),
  ]);
  if (placements.error) throw placements.error;
  if (live.error) throw live.error;
  const capacity = (placements.data ?? []).reduce((sum, row) => sum + row.max_concurrent, 0);
  const sold = live.count ?? 0;
  return { sold, capacity, percent: capacity === 0 ? 0 : Math.round((sold / capacity) * 100) };
}

export type MonthFigures = {
  revenueCents: number;
  paidInvoices: number;
  ticketCents: number;
  newBusinesses: number;
  newContracts: number;
  churned: number;
  renewalDue: number;
  renewalRate: number | null;
};

/** Números de um mês fechado ou em curso — comparáveis entre meses. */
export async function getMonthFigures(month: string): Promise<MonthFigures> {
  const supabase = createServiceClient();
  const { from, to } = monthWindow(month);
  const [revenue, newBusinesses, newContracts, churn, renew] = await Promise.all([
    paidInvoices(supabase, from, to),
    countRows(supabase.from("businesses").select("id", head).gte("created_at", from).lt("created_at", to)),
    countRows(supabase.from("subscriptions").select("id", head).gte("started_at", from).lt("started_at", to)),
    churned(supabase, from, to),
    renewal(supabase, from, to),
  ]);
  return {
    revenueCents: revenue.cents,
    paidInvoices: revenue.count,
    ticketCents: revenue.count === 0 ? 0 : Math.round(revenue.cents / revenue.count),
    newBusinesses,
    newContracts,
    churned: churn,
    renewalDue: renew.due,
    renewalRate: renew.due === 0 ? null : Math.round((renew.renewed / renew.due) * 100),
  };
}

export type GoalProgress = { metric: GoalMetric; target: number | null; actual: number };

async function loadTargets(supabase: Supabase, month: string): Promise<Partial<Record<GoalMetric, number>>> {
  const { data, error } = await supabase.from("business_goals").select("metric, target").eq("month", month);
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((row) => [row.metric, Number(row.target)]));
}

function actualFor(metric: GoalMetric, figures: MonthFigures, occupancyPercent: number): number {
  const byMetric: Record<GoalMetric, number> = {
    revenue_cents: figures.revenueCents,
    new_businesses: figures.newBusinesses,
    new_contracts: figures.newContracts,
    renewal_rate: figures.renewalRate ?? 0,
    ad_occupancy: occupancyPercent,
  };
  return byMetric[metric];
}

export type ExecutiveDashboard = {
  month: string;
  current: MonthFigures;
  previous: MonthFigures;
  yearRevenueCents: number;
  mrrCents: number;
  activeSubscriptions: number;
  activeBusinesses: number;
  businessesByPlan: Record<string, number>;
  delinquentCount: number;
  delinquentCents: number;
  adOccupancy: { sold: number; capacity: number; percent: number };
  goals: GoalProgress[];
};

export async function getExecutiveDashboard(month: string): Promise<ExecutiveDashboard> {
  const supabase = createServiceClient();
  const year = month.slice(0, 4);
  const [current, previous, yearRevenue, recurring, plans, late, occupancy, targets] = await Promise.all([
    getMonthFigures(month),
    getMonthFigures(previousMonth(month)),
    paidInvoices(supabase, `${year}-01-01T00:00:00.000Z`, `${Number(year) + 1}-01-01T00:00:00.000Z`),
    recurringRevenue(supabase),
    businessesByPlan(supabase),
    delinquency(supabase),
    adOccupancy(supabase),
    loadTargets(supabase, month),
  ]);
  return {
    month,
    current,
    previous,
    yearRevenueCents: yearRevenue.cents,
    mrrCents: recurring.mrrCents,
    activeSubscriptions: recurring.activeSubscriptions,
    activeBusinesses: Object.values(plans).reduce((sum, n) => sum + n, 0),
    businessesByPlan: plans,
    delinquentCount: late.count,
    delinquentCents: late.cents,
    adOccupancy: occupancy,
    goals: GOAL_METRICS.map((metric) => ({ metric, target: targets[metric] ?? null, actual: actualFor(metric, current, occupancy.percent) })),
  };
}
