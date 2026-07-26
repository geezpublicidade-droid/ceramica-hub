import { createServiceClient } from "@/lib/supabase/server";

/**
 * Agrega metrics_events (log bruto) de um dia específico em analytics_daily
 * (contagem por empresa+tipo de evento). Idempotente via upsert — rodar de
 * novo pro mesmo dia só recalcula, não duplica. Chamado pelo cron diário
 * (ver src/app/api/cron/aggregate-analytics/route.ts) e reutilizável pra
 * backfill manual.
 */
export async function aggregateAnalyticsForDay(day: string): Promise<{ rowsUpserted: number }> {
  const supabase = createServiceClient();
  const dayStart = `${day}T00:00:00.000Z`;
  const dayEnd = `${day}T23:59:59.999Z`;

  const { data, error } = await supabase
    .from("metrics_events")
    .select("business_id, event_type")
    .not("business_id", "is", null)
    .gte("created_at", dayStart)
    .lte("created_at", dayEnd);
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const key = `${row.business_id}:${row.event_type}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const rows = Array.from(counts.entries()).map(([key, count]) => {
    const [businessId, eventType] = key.split(":");
    return { business_id: businessId, event_type: eventType, day, count };
  });

  if (rows.length === 0) return { rowsUpserted: 0 };

  const { error: upsertError } = await supabase
    .from("analytics_daily")
    .upsert(rows, { onConflict: "business_id,event_type,day" });
  if (upsertError) throw upsertError;

  return { rowsUpserted: rows.length };
}
