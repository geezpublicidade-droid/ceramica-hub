type DailyViewRow = { day: string; count: number };

/** Coluna única (visualizações da página), 7 dias -- sem legenda porque é uma
 * série só; o título da seção que chama já diz o que é plotado. Barra mínima
 * de 6% pra dias com 0 continuarem visíveis na régua do eixo. */
export function DailyViewsChart({ data }: { data: DailyViewRow[] }) {
  const max = Math.max(1, ...data.map((row) => row.count));

  return (
    <div className="flex items-end gap-2">
      {data.map((row) => {
        const heightPct = row.count === 0 ? 6 : Math.max(10, Math.round((row.count / max) * 100));
        const weekday = new Date(row.day)
          .toLocaleDateString("pt-BR", { weekday: "short" })
          .replace(".", "");

        return (
          <div key={row.day} className="group relative flex flex-1 flex-col items-center gap-1.5">
            <span className="pointer-events-none absolute -top-7 z-10 hidden w-max -translate-x-1/2 rounded-lg bg-graphite px-2 py-1 text-[11px] font-medium text-white group-hover:block">
              {row.count} {row.count === 1 ? "visualização" : "visualizações"}
            </span>
            <div className="flex h-16 w-full items-end">
              <div
                className="mx-auto w-full max-w-[22px] rounded-t bg-primary/80 transition-colors group-hover:bg-primary"
                style={{ height: `${heightPct}%` }}
              />
            </div>
            <span className="text-[11px] capitalize text-muted">{weekday}</span>
          </div>
        );
      })}
    </div>
  );
}
