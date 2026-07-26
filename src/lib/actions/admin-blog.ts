"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guards";
import { logAdminAction } from "@/lib/audit-log";
import { translateAndStore } from "@/lib/services/translate";
import { slugify } from "@/lib/slug";

type ActionResult = { success: true } | { success: false; error: string };

const postSchema = z.object({
  title: z.string().trim().min(3, "Título muito curto."),
  excerpt: z.string().trim().min(10, "Resumo muito curto."),
  content: z.string().trim().min(20, "Conteúdo muito curto."),
  coverImageUrl: z.string().trim().url().optional().or(z.literal("")),
  authorName: z.string().trim().min(2).optional().or(z.literal("")),
});

async function generateUniqueSlug(supabase: ReturnType<typeof createServiceClient>, title: string): Promise<string> {
  const base = slugify(title) || "post";
  let candidate = base;
  let suffix = 2;
  while (true) {
    const { data } = await supabase.from("blog_posts").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function createBlogPost(rawInput: z.infer<typeof postSchema>): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin"]);
  const parsed = postSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = createServiceClient();
  const slug = await generateUniqueSlug(supabase, parsed.data.title);

  const { data: post, error } = await supabase
    .from("blog_posts")
    .insert({
      slug,
      title: parsed.data.title,
      excerpt: parsed.data.excerpt,
      content: parsed.data.content,
      cover_image_url: parsed.data.coverImageUrl || null,
      author_name: parsed.data.authorName || "Cerâmica Hub",
    })
    .select("id")
    .single();
  if (error || !post) return { success: false, error: "Não foi possível criar o post." };

  await logAdminAction(adminId, "create_blog_post", "blog_post", post.id, { title: parsed.data.title });
  revalidatePath("/admin/blog");
  return { success: true };
}

export async function publishBlogPost(postId: string): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin"]);
  const supabase = createServiceClient();

  const { data: post } = await supabase.from("blog_posts").select("title, excerpt, content").eq("id", postId).single();
  if (!post) return { success: false, error: "Post não encontrado." };

  const { error } = await supabase
    .from("blog_posts")
    .update({ status: "published", published_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", postId);
  if (error) return { success: false, error: "Não foi possível publicar." };

  // Traduz só na publicação (não a cada rascunho salvo) -- evita gastar
  // cota da DeepL com posts que podem ser reescritos varias vezes antes de ir ao ar.
  void translateAndStore("blog_post", postId, post);

  await logAdminAction(adminId, "publish_blog_post", "blog_post", postId, {});
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  return { success: true };
}

export async function unpublishBlogPost(postId: string): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin"]);
  const supabase = createServiceClient();
  const { error } = await supabase.from("blog_posts").update({ status: "draft" }).eq("id", postId);
  if (error) return { success: false, error: "Não foi possível despublicar." };

  await logAdminAction(adminId, "unpublish_blog_post", "blog_post", postId, {});
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  return { success: true };
}

export async function deleteBlogPost(postId: string): Promise<ActionResult> {
  const adminId = await requireAdmin(["super_admin", "admin"]);
  const supabase = createServiceClient();
  const { error } = await supabase.from("blog_posts").delete().eq("id", postId);
  if (error) return { success: false, error: "Não foi possível excluir o post." };

  await logAdminAction(adminId, "delete_blog_post", "blog_post", postId, {});
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  return { success: true };
}
