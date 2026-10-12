/** Regras puras de agenda de anúncios (sem banco): ocupação por dia, disponibilidade e preço. Datas em "YYYY-MM-DD". */

export type Booking = { startsAt: string; endsAt: string };
export type DayOccupancy = { date: string; used: number; free: number };

const DAY_MS = 86_400_000;

const toUtc = (date: string) => Date.parse(`${date}T00:00:00Z`);
const toDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function addDays(date: string, days: number): string {
  return toDate(toUtc(date) + days * DAY_MS);
}

/** Dias corridos do período, contando início e fim (1 dia = mesmo dia). */
export function countDays(startsAt: string, endsAt: string): number {
  return Math.round((toUtc(endsAt) - toUtc(startsAt)) / DAY_MS) + 1;
}

/** Quantas vagas do espaço estão ocupadas em cada um dos próximos `days` dias. */
export function occupancyByDay(bookings: Booking[], capacity: number, from: string, days: number): DayOccupancy[] {
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(from, i);
    const used = bookings.filter((b) => b.startsAt <= date && b.endsAt >= date).length;
    return { date, used, free: Math.max(0, capacity - used) };
  });
}

/** O período cabe? Todos os dias precisam ter pelo menos uma vaga livre. */
export function isRangeAvailable(bookings: Booking[], capacity: number, startsAt: string, endsAt: string): boolean {
  if (endsAt < startsAt) return false;
  return occupancyByDay(bookings, capacity, startsAt, countDays(startsAt, endsAt)).every((day) => day.free > 0);
}

/** Primeira data (a partir de `from`) em que um período de `length` dias cabe inteiro; null se não houver no horizonte. */
export function firstAvailableStart(bookings: Booking[], capacity: number, from: string, length: number, horizonDays = 180): string | null {
  const days = occupancyByDay(bookings, capacity, from, horizonDays + length);
  for (let i = 0; i + length <= days.length; i++) {
    if (days.slice(i, i + length).every((day) => day.free > 0)) return days[i].date;
  }
  return null;
}

/** Preço proporcional: mensalidade/30 por dia, arredondado pra cima em centavos. */
export function priceForPeriod(monthlyCents: number, days: number): number {
  return Math.ceil((monthlyCents / 30) * days);
}

export type PeriodRules = { minDays: number; maxDays: number; leadDays: number };

/** Valida o período pedido contra as regras do espaço; devolve a mensagem de erro ou null. */
export function validatePeriod(startsAt: string, endsAt: string, today: string, rules: PeriodRules): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startsAt) || !/^\d{4}-\d{2}-\d{2}$/.test(endsAt)) return "Informe as datas de início e término.";
  const earliest = addDays(today, rules.leadDays);
  if (startsAt < earliest) {
    return rules.leadDays > 0
      ? `Este espaço precisa de ${rules.leadDays} dia(s) de antecedência para produção do criativo.`
      : "O início não pode ser no passado.";
  }
  const days = countDays(startsAt, endsAt);
  if (days < 1) return "A data de término deve ser depois do início.";
  if (days < rules.minDays) return `O período mínimo deste espaço é ${rules.minDays} dias.`;
  if (days > rules.maxDays) return `O período máximo deste espaço é ${rules.maxDays} dias.`;
  return null;
}
