import { routing } from "@/i18n/routing";

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const OG_LOCALE: Record<string, string> = {
  pt: "pt_BR",
  en: "en_US",
  es: "es_ES",
  zh: "zh_CN",
};

/** foto real do Espaço Cerâmica já usada no hero da home — serve de imagem
 * padrão pra páginas que não têm foto própria (categoria, institucional). */
const DEFAULT_OG_IMAGE = `${siteUrl}/images/ceramica-hero-1.jpg`;

export function localizedUrl(locale: string, path: string): string {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${siteUrl}${prefix}${path}`;
}

type SocialMetadataInput = {
  title: string;
  description: string;
  locale: string;
  path: string;
  type?: "website" | "profile" | "article";
  /** URL absoluta de uma foto real da entidade (nunca inventar) */
  image?: string | null;
};

export function buildSocialMetadata({
  title,
  description,
  locale,
  path,
  type = "website",
  image,
}: SocialMetadataInput) {
  const url = localizedUrl(locale, path);
  const imageUrl = image ?? DEFAULT_OG_IMAGE;

  return {
    openGraph: {
      title,
      description,
      url,
      siteName: "Cerâmica Hub",
      locale: OG_LOCALE[locale] ?? "pt_BR",
      type,
      images: [{ url: imageUrl }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [imageUrl],
    },
  };
}
