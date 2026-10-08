"use client";

import { DAY_KEYS, type DayKey, type OpeningSchedule } from "@/lib/landing/hours";
import { inputClass, smallButtonClass } from "./wizard-ui";

const DAY_NAMES: Record<DayKey, string> = { mon: "Segunda", tue: "Terça", wed: "Quarta", thu: "Quinta", fri: "Sexta", sat: "Sábado", sun: "Domingo" };
const DEFAULT_RANGE: [string, string] = ["08:00", "18:00"];

type Props = { value: OpeningSchedule | null; onChange: (next: OpeningSchedule | null) => void };

function withDay(schedule: OpeningSchedule, day: DayKey, ranges: [string, string][]): OpeningSchedule {
  const next = { ...schedule };
  if (ranges.length) next[day] = ranges;
  else delete next[day];
  return next;
}

/** Horário por dia da semana (uma faixa por dia; "Copiar para os dias úteis" acelera o preenchimento). */
export function ScheduleEditor({ value, onChange }: Props) {
  const schedule = value ?? {};

  function setRange(day: DayKey, index: 0 | 1, time: string) {
    const current = schedule[day]?.[0] ?? DEFAULT_RANGE;
    const range: [string, string] = index === 0 ? [time, current[1]] : [current[0], time];
    onChange(withDay(schedule, day, [range]));
  }

  function copyToWeekdays() {
    const source = DAY_KEYS.map((day) => schedule[day]).find((ranges) => ranges?.length);
    if (!source) return;
    onChange(DAY_KEYS.slice(0, 5).reduce((acc, day) => withDay(acc, day, source), schedule));
  }

  return (
    <div className="flex flex-col gap-2">
      {DAY_KEYS.map((day) => {
        const range = schedule[day]?.[0];
        return (
          <div key={day} className="flex flex-wrap items-center gap-3">
            <label className="flex w-28 items-center gap-2 text-[15px] text-foreground">
              <input type="checkbox" checked={Boolean(range)} onChange={(e) => onChange(withDay(schedule, day, e.target.checked ? [DEFAULT_RANGE] : []))} />
              {DAY_NAMES[day]}
            </label>
            {range ? (
              <span className="flex items-center gap-2 text-[15px] text-muted">
                <input type="time" aria-label={`${DAY_NAMES[day]} abre`} className={`${inputClass} mt-0 w-auto`} value={range[0]} onChange={(e) => setRange(day, 0, e.target.value)} />
                às
                <input type="time" aria-label={`${DAY_NAMES[day]} fecha`} className={`${inputClass} mt-0 w-auto`} value={range[1]} onChange={(e) => setRange(day, 1, e.target.value)} />
              </span>
            ) : (
              <span className="text-[14px] text-muted">Fechado</span>
            )}
          </div>
        );
      })}
      <button type="button" onClick={copyToWeekdays} className={`${smallButtonClass} mt-1 self-start`}>
        Copiar para segunda a sexta
      </button>
    </div>
  );
}
