import { createServiceClient } from "@/lib/supabase/server";
import { getTranslationsFor } from "@/lib/services/translate";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  authorName: string;
  status: "draft" | "published";
  publishedAt: string | null;
};

type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  author_name: string;
  status: "draft" | "published";
  published_at: string | null;
};

function mapPost(row: BlogPostRow, translation?: Record<string, string>): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: translation?.title ?? row.title,
    excerpt: translation?.excerpt ?? row.excerpt,
    content: translation?.content ?? row.content,
    coverImageUrl: row.cover_image_url,
    authorName: row.author_name,
    status: row.status,
    publishedAt: row.published_at,
  };
}

export async function getPublishedPosts(locale?: string): Promise<BlogPost[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as BlogPostRow[];

  const translations = locale && locale !== "pt" ? await getTranslationsFor("blog_post", rows.map((r) => r.id), locale) : {};
  return rows.map((row) => mapPost(row, translations[row.id]));
}

export async function getPublishedPostBySlug(slug: string, locale?: string): Promise<BlogPost | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as BlogPostRow;

  const translations = locale && locale !== "pt" ? await getTranslationsFor("blog_post", [row.id], locale) : {};
  return mapPost(row, translations[row.id]);
}

export async function getAllPostsForAdmin(): Promise<BlogPost[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapPost(row as BlogPostRow));
}
