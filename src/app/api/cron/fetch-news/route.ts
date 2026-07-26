import { NextResponse } from "next/server";
import { fetchAndStoreNews } from "@/lib/services/news";

/** Disparado pelo Vercel Cron (ver vercel.json) -- busca o feed do Google News filtrado por São Caetano do Sul e grava as noticias novas (dedup por link). */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await fetchAndStoreNews();
  return NextResponse.json(result);
}
