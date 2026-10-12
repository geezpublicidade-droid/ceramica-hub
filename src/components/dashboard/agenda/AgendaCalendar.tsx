import Link from "next/link";
import { AGENDA_KIND_LABEL, AGENDA_TONE_LEGEND, buildMonthGrid, shiftMonth, type AgendaItem } from "@/lib/agenda";
import type { StageTone } from "@/lib/ad-stage";

export const TONE_DOT: Record<StageTone, string> = {
  green: "bg-emerald-500",
  blue: "bg-sky-500",
  yellow: "bg-amber-400",
  red: "bg-red-500",
  gray: "bg-stone-400",
};

const TONE_CHIP: Record<StageTone, string> = {
  green: "bg-emerald-100 text-emerald-900",
  blue: "bg-sky-100 text-sky-900",
  yellow: "bg-amber-100 text-amber-900",
  red: "bg-red-100 text-red-900",
  gray: "bg-stone-200 text-stone-700",
};

const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const WEEK = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

/** Calendário mensal da divulgação da empresa, com as cores de status do painel. */
export function AgendaCalendar({ month, items, today }: { month: string; items: AgendaItem[]; today: string }) {
  const weeks = buildMonthGrid(month, items);
  const [year, number] = month.split("-").map(Number);
  return (
    <section className="glass-card-light rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/dashboard/agenda?mes=${shiftMonth(month, -1)}`} className="rounded-full border border-border px-3 py-1.5 text-[14px]" aria-label="Mês anterior">←</Link>
        <h2 className="text-lg font-semibold capitalize text-foreground">{MONTHS[number - 1]} de {year}</h2>
        <Link href={`/dashboard/agenda?mes=${shiftMonth(month, 1)}`} className="rounded-full border border-border px-3 py-1.5 text-[14px]" aria-label="Próximo mês">→</Link>
      </div>
      <div className="mt-4 hidden grid-cols-7 gap-px text-center text-[12px] uppercase tracking-wide text-muted sm:grid">
        {WEEK.map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="mt-1 hidden grid-cols-7 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid">
        {weeks.flat().map((cell) => (
          <div key={cell.date} className={`min-h-[84px] bg-white p-1.5 ${cell.inMonth ? "" : "opacity-40"} ${cell.date === today ? "ring-2 ring-inset ring-primary" : ""}`}>
            <span className="text-[12px] text-muted">{Number(cell.date.slice(8))}</span>
            <div className="mt-1 flex flex-col gap-1">
              {cell.items.slice(0, 3).map((item) => (
                <span key={item.id} title={`${item.title} — ${item.detail ?? ""}`} className={`truncate rounded px-1 py-0.5 text-[11px] ${TONE_CHIP[item.tone]}`}>
                  {item.time ? `${item.time} ` : ""}{item.title}
                </span>
              ))}
              {cell.items.length > 3 && <span className="text-[11px] text-muted">+{cell.items.length - 3}</span>}
            </div>
          </div>
        ))}
      </div>
      <ul className="mt-4 flex flex-col gap-2 sm:hidden">
        {items.filter((item) => item.date.startsWith(month) || (item.endDate ?? item.date).startsWith(month)).map((item) => (
          <li key={item.id} className="flex items-start gap-2 text-[14px]">
            <i className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${TONE_DOT[item.tone]}`} />
            <span><strong>{item.date.split("-").reverse().slice(0, 2).join("/")}</strong> {item.title}<span className="block text-[12px] text-muted">{item.detail}</span></span>
          </li>
        ))}
        {items.length === 0 && <li className="text-[14px] text-muted">Nada marcado neste mês.</li>}
      </ul>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
        {AGENDA_TONE_LEGEND.map(({ tone, label }) => (
          <li key={tone} className="flex items-center gap-1.5"><i className={`h-2.5 w-2.5 rounded-full ${TONE_DOT[tone]}`} />{label}</li>
        ))}
      </ul>
      <p className="mt-2 text-[12px] text-muted">Tipos: {Object.values(AGENDA_KIND_LABEL).join(" · ")}.</p>
    </section>
  );
}
