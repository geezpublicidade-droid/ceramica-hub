import type { MetadataRoute } from "next";
import { getAllBusinesses } from "@/lib/services/platform";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const businesses = await getAllBusinesses();

  return [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/cadastro`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/termos`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/privacidade`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/contato`, changeFrequency: "yearly", priority: 0.3 },
    ...businesses.map((business) => ({
      url: `${siteUrl}/empresa/${business.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
