import Link from "next/link";
import { CONTENT_STATUS_STYLE } from "@/components/admin/ContentStatusBadge";
import type { ContentItem } from "@/lib/services/content-calendar";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MAX_VISIBLE_PER_DAY = 3;

/** Grade mensal. `month` = YYYY-MM. Cada peça vira um chip com a cor do status
 * e leva pra tela de detalhe; dias com mais peças que o limite mostram "+N". */
export function ContentCalendarGrid({ month, items }: { month: string; items: ContentItem[] }) {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstWeekday = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const today = new Date().toISOString().slice(0, 10);

  const byDay = new Map<string, ContentItem[]>();
  for (const item of items) byDay.set(item.scheduledFor, [...(byDay.get(item.scheduledFor) ?? []), item]);

  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-white/70">
      <div className="grid min-w-[720px] grid-cols-7">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className="border-b border-border px-2 py-2 text-[12px] font-semibold uppercase tracking-wide text-muted">
            {weekday}
          </div>
        ))}
        {cells.map((day, index) => {
          if (day === null) return <div key={`empty-${index}`} className="min-h-24 border-b border-r border-border/60 bg-black/[0.02]" />;
          const date = `${month}-${String(day).padStart(2, "0")}`;
          const dayItems = byDay.get(date) ?? [];
          return (
            <div key={date} className="min-h-24 border-b border-r border-border/60 p-1.5">
              <span
                className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[12px] font-medium ${
                  date === today ? "bg-primary text-white" : "text-muted"
                }`}
              >
                {day}
              </span>
              <div className="mt-1 flex flex-col gap-1">
                {dayItems.slice(0, MAX_VISIBLE_PER_DAY).map((item) => (
                  <Link
                    key={item.id}
                    href={`/admin/marketing/calendario/${item.id}`}
                    title={item.title}
                    className={`truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium hover:opacity-80 ${CONTENT_STATUS_STYLE[item.status]}`}
                  >
                    {item.title}
                  </Link>
                ))}
                {dayItems.length > MAX_VISIBLE_PER_DAY && (
                  <span className="px-1.5 text-[11px] text-muted">+{dayItems.length - MAX_VISIBLE_PER_DAY}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
