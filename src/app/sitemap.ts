import type { MetadataRoute } from "next";
import { getAllBusinesses } from "@/lib/services/platform";
import { getPublishedPosts } from "@/lib/services/blog";
import { categorySlugs } from "@/lib/category-slug";
import { getActiveTowers } from "@/lib/services/towers";
import { routing } from "@/i18n/routing";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function localizedPath(locale: string, path: string): string {
  return locale === routing.defaultLocale ? path : `/${locale}${path}`;
}

function entry(
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
): MetadataRoute.Sitemap[number] {
  return {
    url: `${siteUrl}${localizedPath(routing.defaultLocale, path)}`,
    changeFrequency,
    priority,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((locale) => [locale, `${siteUrl}${localizedPath(locale, path)}`]),
      ),
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [businesses, posts, towers] = await Promise.all([
    getAllBusinesses(),
    getPublishedPosts(),
    getActiveTowers(),
  ]);

  return [
    entry("", "daily", 1),
    entry("/cadastro", "monthly", 0.8),
    entry("/termos", "yearly", 0.2),
    entry("/privacidade", "yearly", 0.2),
    entry("/politica-de-cadastro", "yearly", 0.2),
    entry("/politica-de-publicidade", "yearly", 0.2),
    entry("/politica-de-cancelamento", "yearly", 0.2),
    entry("/contato", "yearly", 0.3),
    entry("/blog", "weekly", 0.6),
    entry("/noticias", "daily", 0.5),
    entry("/business-travel", "monthly", 0.5),
    entry("/auditorios-reunioes", "monthly", 0.5),
    entry("/imobiliarias", "weekly", 0.5),
    ...categorySlugs.map((slug) => entry(`/categoria/${slug}`, "weekly", 0.6)),
    ...towers.map((tower) => entry(`/torres/${tower.slug}`, "weekly", 0.5)),
    ...businesses.map((business) => entry(`/empresa/${business.slug}`, "weekly", 0.6)),
    ...posts.map((post) => entry(`/blog/${post.slug}`, "monthly", 0.5)),
  ];
}
