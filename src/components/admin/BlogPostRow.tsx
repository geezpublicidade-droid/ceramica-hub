"use client";

import { useTransition } from "react";
import { publishBlogPost, unpublishBlogPost, deleteBlogPost } from "@/lib/actions/admin-blog";
import type { BlogPost } from "@/lib/services/blog";

export function BlogPostRow({ post }: { post: BlogPost }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-white/70 p-6">
      <div>
        <p className="text-[16px] font-semibold text-foreground">{post.title}</p>
        <p className="text-[13px] text-muted">
          {post.status === "published" ? "Publicado" : "Rascunho"}
          {post.publishedAt && ` · ${new Date(post.publishedAt).toLocaleDateString("pt-BR")}`}
        </p>
      </div>
      <div className="flex gap-2">
        {post.status === "draft" ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => void publishBlogPost(post.id))}
            className="neu-primary rounded-full px-4 py-2 text-[14px] font-medium text-white disabled:opacity-60"
          >
            Publicar
          </button>
        ) : (
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => void unpublishBlogPost(post.id))}
            className="neu rounded-full px-4 py-2 text-[14px] font-medium text-foreground disabled:opacity-60"
          >
            Despublicar
          </button>
        )}
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => void deleteBlogPost(post.id))}
          className="rounded-full border border-red-200 px-4 py-2 text-[14px] font-medium text-red-600 disabled:opacity-60"
        >
          Excluir
        </button>
      </div>
    </div>
  );
}
