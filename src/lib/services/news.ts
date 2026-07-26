import { XMLParser } from "fast-xml-parser";
import { createServiceClient } from "@/lib/supabase/server";

export type NewsItem = {
  id: string;
  title: string;
  link: string;
  excerpt: string | null;
  sourceName: string | null;
  publishedAt: string | null;
};

const FEED_URL = "https://news.google.com/rss/search?q=%22S%C3%A3o+Caetano+do+Sul%22&hl=pt-BR&gl=BR&ceid=BR:pt-419";

// Google News RSS embute o nome do veículo no fim do título ("Manchete - Veículo")
// e o <source> do item costuma vir vazio -- extrai o veículo do próprio título.
function splitTitleAndSource(rawTitle: string): { title: string; source: string | null } {
  const separatorIndex = rawTitle.lastIndexOf(" - ");
  if (separatorIndex === -1) return { title: rawTitle, source: null };
  return { title: rawTitle.slice(0, separatorIndex), source: rawTitle.slice(separatorIndex + 3) };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Agregador: nunca copia o texto completo da matéria, só título/resumo
 * (o próprio <description> do RSS, que já vem curto) e sempre linka pro
 * site de origem — decisão explícita pra não ter risco de direito autoral.
 */
export async function fetchAndStoreNews(): Promise<{ inserted: number; total: number }> {
  const response = await fetch(FEED_URL, { headers: { "User-Agent": "Mozilla/5.0 (compatible; CeramicaHubBot/1.0)" } });
  if (!response.ok) throw new Error(`Feed retornou ${response.status}`);
  const xml = await response.text();

  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xml);
  const rawItems = parsed?.rss?.channel?.item;
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

  const supabase = createServiceClient();
  let inserted = 0;

  for (const item of items) {
    const rawTitle = String(item.title ?? "").trim();
    const link = String(item.link ?? "").trim();
    if (!rawTitle || !link) continue;

    const { title, source } = splitTitleAndSource(rawTitle);
    const excerpt = item.description ? stripHtml(String(item.description)).slice(0, 300) : null;
    const publishedAt = item.pubDate ? new Date(String(item.pubDate)).toISOString() : null;

    const { error, count } = await supabase
      .from("news_items")
      .upsert(
        { title, link, excerpt, source_name: source, published_at: publishedAt },
        { onConflict: "link", ignoreDuplicates: true, count: "exact" },
      );
    if (error) throw error;
    if (count) inserted += count;
  }

  return { inserted, total: items.length };
}

export async function getRecentNews(limit = 30): Promise<NewsItem[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("news_items")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    link: row.link,
    excerpt: row.excerpt,
    sourceName: row.source_name,
    publishedAt: row.published_at,
  }));
}
