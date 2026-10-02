import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { runAutomations } from "@/lib/services/automations/engine";
import { runOperationalRules } from "@/lib/services/operations/runner";

export const maxDuration = 300;

/** Disparado pelo Vercel Cron (ver vercel.json) uma vez por dia — roda todas as automações ligadas e as regras operacionais. */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await runAutomations();
  const operations = await runOperationalRules();
  return NextResponse.json({ results, operations });
}
