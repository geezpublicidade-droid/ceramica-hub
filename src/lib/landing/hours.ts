export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayKey = (typeof DAY_KEYS)[number];
/** Faixas "HH:MM" de abertura/fechamento; dia ausente ou vazio = fechado. */
export type OpeningSchedule = Partial<Record<DayKey, [string, string][]>>;

const DAY_LABELS: Record<DayKey, string> = {
  mon: "Segunda",
  tue: "Terça",
  wed: "Quarta",
  thu: "Quinta",
  fri: "Sexta",
  sat: "Sábado",
  sun: "Domingo",
};
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const WEEKDAY_FROM_INTL: Record<string, DayKey> = { Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat", Sun: "sun" };

/** Valida o JSON vindo do banco; qualquer coisa fora do formato vira null (a página então só mostra o texto livre). */
export function parseSchedule(raw: unknown): OpeningSchedule | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const schedule: OpeningSchedule = {};
  for (const day of DAY_KEYS) {
    const ranges = (raw as Record<string, unknown>)[day];
    if (ranges === undefined) continue;
    if (!Array.isArray(ranges)) return null;
    const parsed: [string, string][] = [];
    for (const range of ranges) {
      if (!Array.isArray(range) || range.length !== 2) return null;
      const [open, close] = range;
      if (typeof open !== "string" || typeof close !== "string" || !TIME_RE.test(open) || !TIME_RE.test(close) || open >= close) return null;
      parsed.push([open, close]);
    }
    schedule[day] = parsed;
  }
  return schedule;
}

function localParts(date: Date, timeZone: string): { day: DayKey; time: string } {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { day: WEEKDAY_FROM_INTL[get("weekday")], time: `${get("hour")}:${get("minute")}` };
}

/** true/false conforme o horário; null quando a empresa não cadastrou horário estruturado. */
export function isOpenNow(schedule: OpeningSchedule | null, now: Date = new Date(), timeZone = "America/Sao_Paulo"): boolean | null {
  if (!schedule) return null;
  const { day, time } = localParts(now, timeZone);
  return (schedule[day] ?? []).some(([open, close]) => time >= open && time < close);
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  return m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

function formatRanges(ranges: [string, string][]): string {
  return ranges.map(([open, close]) => `${formatTime(open)} às ${formatTime(close)}`).join(" e ");
}

/** Linhas legíveis agrupando dias seguidos com o mesmo horário: "Segunda a sexta: 8h às 20h". Dias fechados são omitidos. */
export function formatSchedule(schedule: OpeningSchedule | null): string[] {
  if (!schedule) return [];
  const lines: string[] = [];
  let i = 0;
  while (i < DAY_KEYS.length) {
    const ranges = schedule[DAY_KEYS[i]] ?? [];
    if (ranges.length === 0) {
      i += 1;
      continue;
    }
    const label = formatRanges(ranges);
    let j = i;
    while (j + 1 < DAY_KEYS.length && formatRanges(schedule[DAY_KEYS[j + 1]] ?? []) === label) j += 1;
    const days = i === j ? DAY_LABELS[DAY_KEYS[i]] : `${DAY_LABELS[DAY_KEYS[i]]} a ${DAY_LABELS[DAY_KEYS[j]].toLowerCase()}`;
    lines.push(`${days}: ${label}`);
    i = j + 1;
  }
  return lines;
}
