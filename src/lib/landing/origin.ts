/** Slug da categoria de onde o visitante veio (referrer interno em /categoria/<slug>[/...]); null se veio de fora ou de outra página. */
export function categoryFromReferrer(referrer: string, ownHost: string): string | null {
  try {
    const url = new URL(referrer);
    if (url.hostname.replace(/^www\./, "") !== ownHost.replace(/^www\./, "")) return null;
    const match = url.pathname.match(/^\/(?:(?:pt|en|es|zh)\/)?categoria\/([a-z0-9-]+)/i);
    return match ? match[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

/** Campanha da visita (`utm_campaign`), no mesmo formato enxuto da origem. */
export function utmCampaignFromSearch(search: string): string {
  return (new URLSearchParams(search).get("utm_campaign") ?? "").trim().toLowerCase().slice(0, 60);
}

export function deviceFromUserAgent(userAgent: string | null): "mobile" | "desktop" {
  return /Mobi|Android|iPhone|iPad/i.test(userAgent ?? "") ? "mobile" : "desktop";
}
