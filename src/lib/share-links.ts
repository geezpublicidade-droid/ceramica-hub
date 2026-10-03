/**
 * Links de divulgação com rastreio (UTM) e atalhos de compartilhamento. Funções puras: o mesmo
 * link vai para o painel da empresa, o botão "Compartilhar" e a ferramenta do admin.
 */

export const SHARE_CHANNELS = [
  { key: "instagram_bio", source: "instagram", medium: "bio" },
  { key: "instagram_story", source: "instagram", medium: "story" },
  { key: "instagram_post", source: "instagram", medium: "post" },
  { key: "facebook", source: "facebook", medium: "social" },
  { key: "whatsapp", source: "whatsapp", medium: "social" },
  { key: "google_business", source: "google", medium: "business_profile" },
  { key: "linkedin", source: "linkedin", medium: "social" },
  { key: "email", source: "email", medium: "assinatura" },
  { key: "qr_impresso", source: "impresso", medium: "qr" },
] as const;

export type ShareChannelKey = (typeof SHARE_CHANNELS)[number]["key"];

export type UtmParams = { source: string; medium: string; campaign?: string; content?: string };

/** Acrescenta `utm_*` à URL, preservando os parâmetros e o hash que ela já tinha. */
export function withUtm(url: string, utm: UtmParams): string {
  const parsed = new URL(url);
  parsed.searchParams.set("utm_source", utm.source);
  parsed.searchParams.set("utm_medium", utm.medium);
  if (utm.campaign) parsed.searchParams.set("utm_campaign", utm.campaign);
  if (utm.content) parsed.searchParams.set("utm_content", utm.content);
  return parsed.toString();
}

/** `Clínica São José!` → `clinica-sao-jose` (valor seguro para utm_campaign/content). */
export function utmSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function trackedLink(url: string, channelKey: ShareChannelKey, campaign?: string): string {
  const channel = SHARE_CHANNELS.find((candidate) => candidate.key === channelKey);
  if (!channel) throw new Error(`Canal desconhecido: ${channelKey}`);
  return withUtm(url, { source: channel.source, medium: channel.medium, campaign: campaign ? utmSlug(campaign) : undefined });
}

export type SocialShareTarget = "whatsapp" | "facebook" | "linkedin" | "x" | "telegram";

/** Link de compartilhamento direto para cada rede, com a URL já rastreada. */
export function socialShareUrl(target: SocialShareTarget, url: string, text: string): string {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);
  switch (target) {
    case "whatsapp":
      return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case "x":
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
    case "telegram":
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
  }
}

/** Fonte da visita a partir da URL (`utm_source`), no mesmo formato que o painel usa; vazio = sem rastreio. */
export function utmSourceFromSearch(search: string): string {
  return (new URLSearchParams(search).get("utm_source") ?? "").trim().toLowerCase().slice(0, 40);
}
