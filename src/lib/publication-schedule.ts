import { addDays } from "./ad-schedule.ts";

/** Datas e horários de publicação (puro). Datas "YYYY-MM-DD"; horários "HH:MM"; capacidade por horário. */
export type PublicationRules = { timeSlots: string[]; weekdays: number[]; capacityPerSlot: number; leadDays: number };
export type PublicationBookingRef = { scheduledFor: string; timeSlot: string };
export type PublicationSlot = { date: string; time: string; free: number };

const weekdayOf = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();

export function isAllowedWeekday(rules: PublicationRules, date: string): boolean {
  return rules.weekdays.length === 0 || rules.weekdays.includes(weekdayOf(date));
}

/** Datas/horários disponíveis (com vaga) nos próximos `days` dias, respeitando antecedência e dias da semana. */
export function openSlots(rules: PublicationRules, bookings: PublicationBookingRef[], today: string, days: number): PublicationSlot[] {
  const times = rules.timeSlots.length > 0 ? rules.timeSlots : [""];
  const slots: PublicationSlot[] = [];
  for (let i = rules.leadDays; i < days; i++) {
    const date = addDays(today, i);
    if (!isAllowedWeekday(rules, date)) continue;
    for (const time of times) {
      const used = bookings.filter((b) => b.scheduledFor === date && b.timeSlot === time).length;
      const free = rules.capacityPerSlot - used;
      if (free > 0) slots.push({ date, time, free });
    }
  }
  return slots;
}

export function validatePublicationSlot(rules: PublicationRules, bookings: PublicationBookingRef[], today: string, date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Escolha a data da publicação.";
  if (date < addDays(today, rules.leadDays)) return `Este item precisa de ${rules.leadDays} dia(s) de antecedência.`;
  if (!isAllowedWeekday(rules, date)) return "Este item não é publicado neste dia da semana.";
  const normalized = rules.timeSlots.length > 0 ? time : "";
  if (rules.timeSlots.length > 0 && !rules.timeSlots.includes(time)) return "Escolha um dos horários disponíveis.";
  const used = bookings.filter((b) => b.scheduledFor === date && b.timeSlot === normalized).length;
  return used >= rules.capacityPerSlot ? "Esse horário acabou de ser reservado. Escolha outro." : null;
}

/** Primeiro dia do mês (YYYY-MM-01) e do mês seguinte, para contar o uso do benefício. */
export function monthBounds(date: string): { from: string; to: string } {
  const from = `${date.slice(0, 7)}-01`;
  const next = new Date(`${from}T00:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return { from, to: next.toISOString().slice(0, 10) };
}
