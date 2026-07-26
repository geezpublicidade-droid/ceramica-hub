import { getActiveCampaignForPlacement } from "@/lib/services/ads";
import { logMetricEvent } from "@/lib/services/platform";
import { AdLink } from "@/components/ads/AdLink";

/**
 * Não renderiza nada se não houver campanha aprovada, dentro do período e de
 * anunciante não-bloqueado pra essa posição — sem placeholder vazio ocupando
 * espaço. Rótulo "Patrocinado" é sempre visível, nunca opcional (regra
 * central de exclusividade: anunciante externo nunca aparenta ser membro).
 */
export async function AdSlot({ placementKey }: { placementKey: string }) {
  const campaign = await getActiveCampaignForPlacement(placementKey);
  if (!campaign) return null;

  const desktopCreative = campaign.creatives.find((c) => c.device === "desktop");
  const mobileCreative = campaign.creatives.find((c) => c.device === "mobile");
  if (!desktopCreative && !mobileCreative) return null;

  await logMetricEvent("ad_impression", undefined, { campaignId: campaign.id });

  return (
    <div className="mx-auto max-w-6xl px-6">
      <div className="relative overflow-hidden rounded-2xl border border-border">
        <span className="absolute left-3 top-3 z-10 rounded-full bg-black/60 px-2.5 py-1 text-[12px] font-medium uppercase tracking-wide text-white">
          Patrocinado
        </span>
        <AdLink href={campaign.targetUrl} campaignId={campaign.id}>
          {desktopCreative && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={desktopCreative.imageUrl} alt={desktopCreative.altText} className="hidden w-full sm:block" />
          )}
          {mobileCreative && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mobileCreative.imageUrl} alt={mobileCreative.altText} className="block w-full sm:hidden" />
          )}
        </AdLink>
      </div>
    </div>
  );
}
