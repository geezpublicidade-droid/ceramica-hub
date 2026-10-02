import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { fetchAndStoreNews } from "@/lib/services/news";

/** Disparado pelo Vercel Cron (ver vercel.json) -- busca o feed do Google News filtrado por São Caetano do Sul e grava as noticias novas (dedup por link). */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await fetchAndStoreNews();
  return NextResponse.json(result);
}
