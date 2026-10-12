import { addDays } from "./ad-schedule.ts";
import type { StageTone } from "./ad-stage.ts";

/** Agenda de divulgação (pura): itens de várias origens num só calendário, com as cores do painel. */
export type AgendaKind = "anuncio" | "publicacao" | "promocao" | "destaque_categoria" | "evento";
export type AgendaItem = {
  id: string;
  kind: AgendaKind;
  title: string;
  /** primeiro dia (YYYY-MM-DD) */
  date: string;
  /** último dia; se faltar, é um dia só */
  endDate?: string;
  time?: string;
  tone: StageTone;
  detail?: string;
  href?: string;
};

export const AGENDA_KIND_LABEL: Record<AgendaKind, string> = {
  anuncio: "Anúncio",
  publicacao: "Publicação",
  promocao: "Promoção",
  destaque_categoria: "Destaque em categoria",
  evento: "Evento",
};

export const AGENDA_TONE_LEGEND: { tone: StageTone; label: string }[] = [
  { tone: "green", label: "Publicado / no ar" },
  { tone: "blue", label: "Agendado" },
  { tone: "yellow", label: "Aguardando aprovação ou pagamento" },
  { tone: "red", label: "Precisa de correção" },
  { tone: "gray", label: "Indisponível / encerrado" },
];

export function coversDay(item: AgendaItem, day: string): boolean {
  return item.date <= day && (item.endDate ?? item.date) >= day;
}

export type MonthCell = { date: string; inMonth: boolean; items: AgendaItem[] };

/** Grade de semanas (domingo a sábado) do mês `YYYY-MM`, com os itens de cada dia. */
export function buildMonthGrid(month: string, items: AgendaItem[]): MonthCell[][] {
  const first = `${month}-01`;
  const startOffset = new Date(`${first}T00:00:00Z`).getUTCDay();
  const gridStart = addDays(first, -startOffset);
  const weeks: MonthCell[][] = [];
  let cursor = gridStart;
  for (let week = 0; week < 6; week++) {
    const row: MonthCell[] = [];
    for (let d = 0; d < 7; d++) {
      row.push({ date: cursor, inMonth: cursor.startsWith(month), items: items.filter((item) => coversDay(item, cursor)) });
      cursor = addDays(cursor, 1);
    }
    if (week >= 4 && !row.some((cell) => cell.inMonth)) break;
    weeks.push(row);
  }
  return weeks;
}

const byDateThenTime = (a: AgendaItem, b: AgendaItem) => a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? "");

/** Linha do tempo: o que acontece hoje e o que vem nos próximos dias. */
export function buildTimeline(items: AgendaItem[], today: string, horizonDays = 14): { today: AgendaItem[]; upcoming: AgendaItem[] } {
  const limit = addDays(today, horizonDays);
  return {
    today: items.filter((item) => coversDay(item, today)).sort(byDateThenTime),
    upcoming: items.filter((item) => item.date > today && item.date <= limit).sort(byDateThenTime),
  };
}

export function monthKey(date: string): string {
  return date.slice(0, 7);
}

export function shiftMonth(month: string, delta: number): string {
  const d = new Date(`${month}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + delta);
  return d.toISOString().slice(0, 7);
}
