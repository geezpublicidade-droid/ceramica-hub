import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { getPopularSearches, smartSearch } from "@/lib/services/smart-search";
import { RATE_LIMITS, withinRateLimit } from "@/lib/services/rate-limit";

export const dynamic = "force-dynamic";

function resolveLocale(raw: string | null): string {
  return routing.locales.includes(raw as (typeof routing.locales)[number]) ? (raw as string) : routing.defaultLocale;
}

/** Pesquisa inteligente: `?q=` devolve sugestões e a interpretação da frase; `?popular=1` devolve buscas em alta. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = resolveLocale(url.searchParams.get("locale"));

  if (!(await withinRateLimit(RATE_LIMITS.smartSearch))) {
    return NextResponse.json({ error: "Muitas buscas. Tente de novo em instantes." }, { status: 429, headers: { "Retry-After": "60" } });
  }

  try {
    if (url.searchParams.get("popular") === "1") {
      return NextResponse.json(await getPopularSearches(locale), {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      });
    }
    return NextResponse.json(await smartSearch(url.searchParams.get("q") ?? "", locale), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[smart-search] falhou:", error);
    // a barra de busca nunca pode quebrar a página: sem sugestões, o Enter ainda leva a /empresas
    return NextResponse.json({ chips: [], searchHref: "/empresas", suggestions: [], didYouMean: null });
  }
}
