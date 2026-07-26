import { getActiveCampaignsForPlacement } from "@/lib/services/ads";
import { logMetricEvent } from "@/lib/services/platform";
import { AdCarouselTrack } from "@/components/ads/AdCarouselTrack";

/**
 * Carrossel horizontal com todos os anunciantes ativos pra essa posição ao
 * mesmo tempo (diferente do AdSlot, que sorteia só um) -- pensado pra
 * mostrar vários pagantes numa faixa só, tipo vitrine.
 */
export async function AdCarousel({ placementKey }: { placementKey: string }) {
  const campaigns = await getActiveCampaignsForPlacement(placementKey);
  const withCreative = campaigns.filter((c) => c.creatives.length > 0);
  if (withCreative.length === 0) return null;

  await Promise.all(withCreative.map((c) => logMetricEvent("ad_impression", undefined, { campaignId: c.id })));

  return <AdCarouselTrack campaigns={withCreative} />;
}
