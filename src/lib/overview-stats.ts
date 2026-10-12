/** Indicadores do painel inicial a partir do log de eventos (puro): período atual x anterior e horário de pico. */
export type EventRow = { eventType: string; createdAt: string };

export type PeriodCounts = { views: number; whatsapp: number; routes: number; phone: number; coupons: number };
export type OverviewStats = { current: PeriodCounts; previous: PeriodCounts; peak: { weekday: number; fromHour: number; toHour: number } | null };

const DAY_MS = 86_400_000;
const PEAK_MIN_VIEWS = 30;
const PEAK_WINDOW_HOURS = 3;
/** Horário de Brasília (UTC-3) para o pico; o Hub atende um complexo em São Paulo. */
const BRT_OFFSET_MS = -3 * 3_600_000;

const EMPTY = (): PeriodCounts => ({ views: 0, whatsapp: 0, routes: 0, phone: 0, coupons: 0 });

function bump(counts: PeriodCounts, eventType: string) {
  if (eventType === "commercial_page_viewed") counts.views++;
  else if (eventType === "whatsapp_clicked") counts.whatsapp++;
  else if (eventType === "directions_clicked") counts.routes++;
  else if (eventType === "phone_clicked") counts.phone++;
  else if (eventType === "coupon_redeemed") counts.coupons++;
}

export function summarizeOverview(rows: EventRow[], now: Date, periodDays = 30): OverviewStats {
  const current = EMPTY();
  const previous = EMPTY();
  const startCurrent = now.getTime() - periodDays * DAY_MS;
  const startPrevious = startCurrent - periodDays * DAY_MS;
  const byWeekdayHour = new Map<string, number>();
  let viewTotal = 0;

  for (const row of rows) {
    const at = Date.parse(row.createdAt);
    if (at >= startCurrent && at <= now.getTime()) bump(current, row.eventType);
    else if (at >= startPrevious && at < startCurrent) bump(previous, row.eventType);
    if (row.eventType === "commercial_page_viewed" && at >= startPrevious) {
      const local = new Date(at + BRT_OFFSET_MS);
      const key = `${local.getUTCDay()}-${local.getUTCHours()}`;
      byWeekdayHour.set(key, (byWeekdayHour.get(key) ?? 0) + 1);
      viewTotal++;
    }
  }
  return { current, previous, peak: viewTotal >= PEAK_MIN_VIEWS ? findPeak(byWeekdayHour) : null };
}

/** Dia da semana mais movimentado + a janela de 3 horas mais forte nesse dia. */
function findPeak(byWeekdayHour: Map<string, number>): OverviewStats["peak"] {
  const perDay = new Map<number, number>();
  for (const [key, count] of byWeekdayHour) {
    const day = Number(key.split("-")[0]);
    perDay.set(day, (perDay.get(day) ?? 0) + count);
  }
  const bestDay = [...perDay.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (bestDay === undefined) return null;
  let bestStart = 0;
  let bestSum = -1;
  for (let start = 0; start <= 24 - PEAK_WINDOW_HOURS; start++) {
    let sum = 0;
    for (let h = start; h < start + PEAK_WINDOW_HOURS; h++) sum += byWeekdayHour.get(`${bestDay}-${h}`) ?? 0;
    if (sum > bestSum) { bestSum = sum; bestStart = start; }
  }
  return { weekday: bestDay, fromHour: bestStart, toHour: bestStart + PEAK_WINDOW_HOURS };
}

/** Contatos = quem clicou para falar, ligar ou pedir rota; conversão sobre as visualizações. */
export function conversionRate(counts: PeriodCounts, leads: number): number | null {
  if (counts.views <= 0) return null;
  const contacts = counts.whatsapp + counts.phone + counts.routes + leads;
  return Math.round((contacts / counts.views) * 1000) / 10;
}
