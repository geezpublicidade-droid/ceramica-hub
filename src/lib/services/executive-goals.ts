/** Metas do dashboard executivo (Fase 4.1). Constantes puras + helpers de mês, sem acesso a banco. */

export const GOAL_METRICS = ["revenue_cents", "new_businesses", "new_contracts", "renewal_rate", "ad_occupancy"] as const;
export type GoalMetric = (typeof GOAL_METRICS)[number];

export type GoalMeta = {
  label: string;
  /** Unidade do valor digitado/mostrado: R$ (centavos no banco), % ou contagem. */
  unit: "money" | "percent" | "count";
};

export const GOALS: Record<GoalMetric, GoalMeta> = {
  revenue_cents: { label: "Meta de receita", unit: "money" },
  new_businesses: { label: "Meta de novas empresas", unit: "count" },
  new_contracts: { label: "Meta mensal de vendas (novos contratos)", unit: "count" },
  renewal_rate: { label: "Meta de renovação", unit: "percent" },
  ad_occupancy: { label: "Meta de ocupação publicitária", unit: "percent" },
};

export function isGoalMetric(value: string): value is GoalMetric {
  return (GOAL_METRICS as readonly string[]).includes(value);
}

export function currentMonthKey(now = new Date()): string {
  return now.toISOString().slice(0, 7);
}

export function isMonthKey(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

/** Mês anterior a "YYYY-MM". */
export function previousMonth(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  return new Date(Date.UTC(year, mon - 2, 1)).toISOString().slice(0, 7);
}

/** Mês seguinte a "YYYY-MM". */
export function nextMonth(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  return new Date(Date.UTC(year, mon, 1)).toISOString().slice(0, 7);
}

/** Janela [from, to) do mês em ISO, em UTC. */
export function monthWindow(month: string): { from: string; to: string } {
  const [year, mon] = month.split("-").map(Number);
  return {
    from: new Date(Date.UTC(year, mon - 1, 1)).toISOString(),
    to: new Date(Date.UTC(year, mon, 1)).toISOString(),
  };
}

/** Variação percentual de `current` sobre `previous`; null quando não há base de comparação. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Quanto da meta foi atingido, em %, sem passar de 999. */
export function goalProgress(actual: number, target: number): number | null {
  if (target <= 0) return null;
  return Math.min(999, Math.round((actual / target) * 100));
}
