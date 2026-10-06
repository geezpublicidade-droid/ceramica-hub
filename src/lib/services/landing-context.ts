import type { Business } from "@/data/businesses";
import type { LandingContext } from "@/components/landing-empresa/context";
import { getLandingData } from "@/lib/services/landing";
import { getVirtualTourScenes } from "@/lib/services/platform";
import { getActiveTowers } from "@/lib/services/towers";
import { defaultWhatsappMessage, whatsappDigits, whatsappUrl } from "@/lib/landing/whatsapp";

type Options = { locale?: string; allowDraft?: boolean };

/**
 * Monta o contexto da landing (dados, WhatsApp, mapa, rota). Usado pela página pública
 * e pelo preview do painel (`allowDraft` mostra o rascunho para a empresa e o admin).
 */
export async function buildLandingContext(
  business: Business,
  canonicalUrl: string,
  categoryLabel: string,
  { locale, allowDraft = false }: Options = {},
): Promise<LandingContext> {
  const [data, tourScenes, towers] = await Promise.all([
    getLandingData(business, { locale, allowDraft }),
    getVirtualTourScenes(business.id, locale),
    getActiveTowers(),
  ]);

  const tower = towers.find((item) => business.floor.startsWith(item.name));
  const towerQuery = tower ? `${tower.name}, ${tower.address}` : null;
  const whatsappPhone = whatsappDigits(data.config.whatsappPhone ?? business.phone);

  return {
    business,
    data,
    whatsappHref: whatsappUrl(whatsappPhone, data.config.whatsappMessage ?? defaultWhatsappMessage(business.name)),
    whatsappPhone,
    phoneDigits: business.phone.replace(/[^\d+]/g, ""),
    directionsUrl: towerQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(towerQuery)}` : null,
    mapEmbedUrl: towerQuery ? `https://www.google.com/maps?q=${encodeURIComponent(towerQuery)}&output=embed` : null,
    address: tower?.address ?? null,
    categoryLabel,
    tourScenes,
    canonicalUrl,
  };
}
