import { NextResponse } from "next/server";
import { getActiveCampaignForPlacement } from "@/lib/services/ads";
import { logMetricEvent } from "@/lib/services/platform";

export const dynamic = "force-dynamic";

/**
 * A página /preview usa ISR (revalidate=60) pra não pesar consulta no banco
 * a cada view -- mas isso "congela" um Server Component junto com o HTML
 * cacheado, inclusive o sorteio aleatório de campanha (frequência fica presa
 * por até 60s em vez de mudar a cada request). Por isso o AdSlot busca aqui,
 * fora do cache da página, via fetch client-side.
 */
export async function GET(request: Request) {
  const placementKey = new URL(request.url).searchParams.get("placement");
  if (!placementKey) return NextResponse.json({ error: "placement é obrigatório" }, { status: 400 });

  const campaign = await getActiveCampaignForPlacement(placementKey);
  if (!campaign) return NextResponse.json(null);

  await logMetricEvent("ad_impression", undefined, { campaignId: campaign.id });
  return NextResponse.json(campaign);
}
