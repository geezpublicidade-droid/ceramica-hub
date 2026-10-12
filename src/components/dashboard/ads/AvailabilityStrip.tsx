import type { DayOccupancy } from "@/lib/ad-schedule";
import { formatDateBR } from "@/lib/utils";

/** Faixa dos próximos dias do espaço: verde = vaga, cinza = ocupado, âmbar = última vaga (capacidade > 1). */
export function AvailabilityStrip({ days, capacity }: { days: DayOccupancy[]; capacity: number }) {
  return (
    <div>
      <div className="flex h-5 gap-px overflow-hidden rounded" role="img" aria-label="Disponibilidade dos próximos 90 dias">
        {days.map((day) => {
          const tone = day.free === 0 ? "bg-[#c9c3bb]" : capacity > 1 && day.free === 1 ? "bg-amber-400" : "bg-emerald-500";
          return (
            <span
              key={day.date}
              title={`${formatDateBR(day.date)} — ${day.free === 0 ? "ocupado" : `${day.free} vaga(s)`}`}
              className={`h-full flex-1 ${tone}`}
            />
          );
        })}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 text-[12px] text-muted">
        <span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-emerald-500" />Livre</span>
        {capacity > 1 && <span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-amber-400" />Última vaga</span>}
        <span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-[#c9c3bb]" />Ocupado</span>
      </div>
    </div>
  );
}
