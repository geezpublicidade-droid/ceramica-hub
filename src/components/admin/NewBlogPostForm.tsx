"use client";

import { useState, useTransition } from "react";
import { createBlogPost } from "@/lib/actions/admin-blog";

const inputClass = "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[14px] font-medium text-foreground";

export function NewBlogPostForm() {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createBlogPost({ title, excerpt, content, coverImageUrl, authorName });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setTitle("");
      setExcerpt("");
      setContent("");
      setCoverImageUrl("");
      setAuthorName("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-3xl border border-border bg-white/70 p-6">
      <p className="text-[14px] font-medium uppercase tracking-[0.15em] text-muted">Novo post</p>
      <label>
        <span className={labelClass}>Título</span>
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label>
        <span className={labelClass}>Resumo (aparece na listagem)</span>
        <textarea className={inputClass} rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
      </label>
      <label>
        <span className={labelClass}>Conteúdo</span>
        <textarea className={inputClass} rows={10} value={content} onChange={(e) => setContent(e.target.value)} />
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label>
          <span className={labelClass}>URL da imagem de capa (opcional)</span>
          <input className={inputClass} value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} placeholder="https://..." />
        </label>
        <label>
          <span className={labelClass}>Autor (opcional)</span>
          <input className={inputClass} value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Cerâmica Hub" />
        </label>
      </div>

      {error && <p className="text-[14px] text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="neu-primary mt-2 self-start rounded-full px-6 py-3 text-[15px] font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Salvando..." : "Criar rascunho"}
      </button>
    </form>
  );
}
