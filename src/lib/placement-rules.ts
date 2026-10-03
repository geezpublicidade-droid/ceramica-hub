/**
 * Regras puras das posições comerciais por categoria (sem banco, sem framework), para poderem
 * ser testadas e reaproveitadas por serviços, regras automáticas e telas.
 */

export const PLACEMENT_STATUSES = ["reserved", "active", "paused", "expired", "cancelled"] as const;
export type PlacementStatus = (typeof PLACEMENT_STATUSES)[number];
export const PAYMENT_STATUSES = ["pending", "paid", "overdue", "waived"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Aguardando pagamento",
  paid: "Pago",
  overdue: "Em atraso",
  waived: "Isento",
};

/** Situação real hoje, combinando status, pagamento e datas (o que o visitante de fato vê). */
export type PlacementLiveState = "no_ar" | "agendada" | "vencendo" | "aguardando" | "suspensa" | "encerrada";
export const PLACEMENT_LIVE_LABEL: Record<PlacementLiveState, string> = {
  no_ar: "No ar",
  agendada: "Agendada",
  vencendo: "Vence em breve",
  aguardando: "Aguardando liberação",
  suspensa: "Suspensa",
  encerrada: "Encerrada",
};

/** Pagamento que libera a posição para o público. */
export const PAYMENT_STATUSES_THAT_RELEASE: readonly PaymentStatus[] = ["paid", "waived"];

export const EXPIRING_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Data de hoje em São Paulo (YYYY-MM-DD): contrato vence no fim do dia local, não em UTC. */
export function todaySaoPaulo(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now);
}

/** Dias inteiros de `from` até `to` (YYYY-MM-DD); negativo se `to` já passou. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

export function computeLiveState(
  row: { status: PlacementStatus; payment_status: PaymentStatus; starts_at: string; ends_at: string },
  today: string,
): PlacementLiveState {
  if (row.status === "cancelled" || row.status === "expired" || row.ends_at < today) return "encerrada";
  if (row.status === "paused") return "suspensa";
  if (row.status === "reserved") return "aguardando";
  if (!PAYMENT_STATUSES_THAT_RELEASE.includes(row.payment_status)) return "aguardando";
  if (row.starts_at > today) return "agendada";
  return daysBetween(today, row.ends_at) <= EXPIRING_DAYS ? "vencendo" : "no_ar";
}

/**
 * Sorteio ponderado sem reposição: quem tem `rotation_weight` maior tende a aparecer mais, mas
 * ninguém fica sempre fora. Com anunciantes dentro do limite, todos aparecem na ordem manual.
 * `random` é injetável para teste.
 */
export function pickWeighted<T extends { rotation_weight: number; position: number }>(
  items: T[],
  limit: number,
  random: () => number = Math.random,
): T[] {
  if (items.length <= limit) return [...items].sort((a, b) => a.position - b.position);
  const pool = [...items];
  const chosen: T[] = [];
  while (chosen.length < limit && pool.length > 0) {
    const total = pool.reduce((sum, item) => sum + item.rotation_weight, 0);
    let ticket = random() * total;
    const index = pool.findIndex((item) => (ticket -= item.rotation_weight) < 0);
    chosen.push(...pool.splice(index === -1 ? pool.length - 1 : index, 1));
  }
  return chosen;
}
