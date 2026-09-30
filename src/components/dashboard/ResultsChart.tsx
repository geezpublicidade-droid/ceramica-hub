import type { DailyResult } from "@/lib/services/business-results";

function shortDate(day: string): string {
  return day.split("-").reverse().slice(0, 2).join("/");
}

/** Barras de visualizações por dia. Com 90 dias as barras ficam finas; o rótulo do eixo só aparece no primeiro, meio e último dia. */
export function ResultsChart({ data }: { data: DailyResult[] }) {
  const max = Math.max(1, ...data.map((row) => row.views));
  const labelAt = new Set([0, Math.floor(data.length / 2), data.length - 1]);

  return (
    <div className="flex items-end gap-[2px]">
      {data.map((row, index) => {
        const heightPct = row.views === 0 ? 4 : Math.max(8, Math.round((row.views / max) * 100));
        return (
          <div key={row.day} className="group relative flex flex-1 flex-col items-center gap-1.5">
            <span className="pointer-events-none absolute -top-9 z-10 hidden w-max -translate-x-1/2 rounded-lg bg-graphite px-2 py-1 text-[11px] font-medium text-white group-hover:block">
              {shortDate(row.day)}: {row.views} visualizações · {row.leads} contatos
            </span>
            <div className="flex h-24 w-full items-end">
              <div className="w-full rounded-t bg-primary/80 group-hover:bg-primary" style={{ height: `${heightPct}%` }} />
            </div>
            <span className="h-3 text-[10px] text-muted">{labelAt.has(index) ? shortDate(row.day) : ""}</span>
          </div>
        );
      })}
    </div>
  );
}
