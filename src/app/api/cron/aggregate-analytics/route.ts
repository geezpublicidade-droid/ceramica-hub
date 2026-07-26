import { NextResponse } from "next/server";
import { aggregateAnalyticsForDay } from "@/lib/services/analytics-aggregation";

/** Disparado pelo Vercel Cron (ver vercel.json) uma vez por dia — agrega o dia anterior completo. */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const result = await aggregateAnalyticsForDay(yesterday);
  return NextResponse.json({ day: yesterday, ...result });
}
