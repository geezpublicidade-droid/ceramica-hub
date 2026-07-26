import { NextResponse } from "next/server";
import { getActiveCampaignsForPlacement } from "@/lib/services/ads";
import { logMetricEvent } from "@/lib/services/platform";

export const dynamic = "force-dynamic";

/** Mesmo motivo do /api/ads/slot: foge do cache ISR da página pra sortear/logar a cada request de verdade. */
export async function GET(request: Request) {
  const placementKey = new URL(request.url).searchParams.get("placement");
  if (!placementKey) return NextResponse.json({ error: "placement é obrigatório" }, { status: 400 });

  const campaigns = (await getActiveCampaignsForPlacement(placementKey)).filter((c) => c.creatives.length > 0);
  await Promise.all(campaigns.map((c) => logMetricEvent("ad_impression", undefined, { campaignId: c.id })));
  return NextResponse.json(campaigns);
}
