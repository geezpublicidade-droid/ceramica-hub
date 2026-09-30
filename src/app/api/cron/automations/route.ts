import { NextResponse } from "next/server";
import { runAutomations } from "@/lib/services/automations/engine";

export const maxDuration = 300;

/** Disparado pelo Vercel Cron (ver vercel.json) uma vez por dia — roda todas as automações ligadas. */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await runAutomations();
  return NextResponse.json({ results });
}
