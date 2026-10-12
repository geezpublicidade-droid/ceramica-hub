"use client";

import { useState } from "react";
import { useAdminAction } from "@/components/admin/useAdminAction";
import { addAnchorPost, deleteAnchorPost, setAnchorPostActive } from "@/lib/actions/admin-anchors";
import type { AnchorPost, AnchorPostKind } from "@/lib/services/anchors";
import { formatDateBR } from "@/lib/utils";

const inputClass = "rounded-xl border border-border bg-white px-3 py-2 text-[14px] text-foreground outline-none focus:border-primary";

const KIND_LABEL: Record<AnchorPostKind, string> = { evento: "Evento", experiencia: "Experiência", novidade: "Novidade" };

function NewPostForm({ partnerId }: { partnerId: string }) {
  const empty = { kind: "evento" as AnchorPostKind, title: "", body: "", happensOn: "", imageUrl: "", link: "" };
  const [form, setForm] = useState(empty);
  const { error, isPending, run } = useAdminAction();
  const set = (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        run(() => addAnchorPost(partnerId, form), () => setForm(empty));
      }}
      className="grid grid-cols-1 gap-2 rounded-2xl border border-dashed border-border p-4 sm:grid-cols-3"
    >
      <select className={inputClass} value={form.kind} onChange={set("kind")}>
        {Object.entries(KIND_LABEL).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <input className={`${inputClass} sm:col-span-2`} placeholder="Título" value={form.title} onChange={set("title")} />
      <input className={`${inputClass} sm:col-span-3`} placeholder="Texto curto" value={form.body} onChange={set("body")} />
      <input type="date" className={inputClass} value={form.happensOn} onChange={set("happensOn")} />
      <input className={inputClass} placeholder="Imagem (URL)" value={form.imageUrl} onChange={set("imageUrl")} />
      <input className={inputClass} placeholder="Link (opcional)" value={form.link} onChange={set("link")} />
      <button type="submit" disabled={isPending} className="neu-primary rounded-full px-5 py-2 text-[14px] font-medium text-white disabled:opacity-60 sm:col-span-3 sm:w-fit">
        Adicionar publicação
      </button>
      {error && <p className="text-[13px] text-red-700 sm:col-span-3">{error}</p>}
    </form>
  );
}

function PostRow({ partnerId, post }: { partnerId: string; post: AnchorPost }) {
  const { error, isPending, run } = useAdminAction();
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-white/70 p-4">
      <div>
        <p className="text-[15px] font-semibold text-foreground">
          {post.title}
          {!post.active && <span className="ml-2 text-[12px] font-normal text-muted">(oculta)</span>}
        </p>
        <p className="text-[12px] text-muted">{[KIND_LABEL[post.kind], post.happensOn && formatDateBR(post.happensOn)].filter(Boolean).join(" · ")}</p>
        {error && <p className="text-[12px] text-red-700">{error}</p>}
      </div>
      <div className="flex items-center gap-3 text-[13px]">
        <button type="button" disabled={isPending} onClick={() => run(() => setAnchorPostActive(partnerId, post.id, !post.active))} className="text-foreground disabled:opacity-60">
          {post.active ? "Ocultar" : "Mostrar"}
        </button>
        <button type="button" disabled={isPending} onClick={() => run(() => deleteAnchorPost(partnerId, post.id))} className="text-red-600 disabled:opacity-60">
          Excluir
        </button>
      </div>
    </li>
  );
}

/** Eventos, experiências e novidades exibidos na página pública da âncora. */
export function AnchorPostsPanel({ partnerId, posts }: { partnerId: string; posts: AnchorPost[] }) {
  return (
    <section className="flex flex-col gap-4">
      <p className="text-[17px] font-semibold text-foreground">Eventos, experiências e novidades ({posts.length})</p>
      <NewPostForm partnerId={partnerId} />
      <ul className="flex flex-col gap-3">
        {posts.map((post) => (
          <PostRow key={post.id} partnerId={partnerId} post={post} />
        ))}
      </ul>
    </section>
  );
}
