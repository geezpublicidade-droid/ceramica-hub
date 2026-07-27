import { NextResponse } from "next/server";
import { searchGlobal } from "@/lib/services/global-search";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const locale = url.searchParams.get("locale") ?? undefined;

  if (!q.trim()) return NextResponse.json([]);

  const results = await searchGlobal(q, locale);
  return NextResponse.json(results);
}
