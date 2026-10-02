import type { RankedItem } from "@/lib/services/portal-analytics";

/** Lista ranqueada com barra proporcional ao maior item; vazia mostra `empty`, nunca número inventado. */
export function RankedList({ title, items, empty }: { title: string; items: RankedItem[]; empty: string }) {
  const max = Math.max(1, ...items.map((item) => item.total));
  return (
    <section className="rounded-2xl border border-border bg-white/70 p-4">
      <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-[14px] text-muted">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.label} className="text-[14px]">
              <div className="flex justify-between gap-3">
                <span className="truncate text-foreground">{item.label}</span>
                <span className="font-medium text-foreground">{item.total}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-primary/10">
                <div className="h-1.5 rounded-full bg-primary" style={{ width: `${(item.total / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
