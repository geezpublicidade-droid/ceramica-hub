import { NextResponse } from "next/server";
import { searchGlobal } from "@/lib/services/global-search";
import { RATE_LIMITS, withinRateLimit } from "@/lib/services/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const locale = url.searchParams.get("locale") ?? undefined;

  if (!q.trim()) return NextResponse.json([]);
  if (!(await withinRateLimit(RATE_LIMITS.search))) {
    return NextResponse.json({ error: "Muitas buscas. Tente de novo em instantes." }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const results = await searchGlobal(q, locale);
  return NextResponse.json(results);
}
