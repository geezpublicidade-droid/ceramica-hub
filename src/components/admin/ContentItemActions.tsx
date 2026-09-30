"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addContentCommentAction, deleteContentItemAction, setContentStatusAction } from "@/lib/actions/content-calendar";
import { CONTENT_STATUS_LABEL, CONTENT_STATUS_ORDER, type ContentStatus } from "@/lib/services/content-calendar";

const inputClass =
  "w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";

/** Mudança de status, exclusão e novo comentário de uma peça. Cada ação
 * reporta erro em linha e recarrega os dados do servidor ao concluir. */
export function ContentItemActions({ itemId, status }: { itemId: string; status: ContentStatus }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  function run(action: () => Promise<{ success: boolean; error?: string }>, onSuccess?: () => void) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.success) {
          setError(result.error ?? "Não foi possível concluir a ação.");
          return;
        }
        onSuccess?.();
        router.refresh();
      } catch {
        setError("Sem permissão ou falha de conexão. Tente de novo.");
      }
    });
  }

  function handleDelete() {
    if (!window.confirm("Excluir esta peça e todo o histórico dela?")) return;
    run(() => deleteContentItemAction(itemId), () => router.push("/admin/marketing/calendario"));
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white/70 p-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex-1">
          <span className="text-[14px] font-medium text-foreground">Status</span>
          <select
            className={`${inputClass} mt-1.5`}
            value={status}
            disabled={isPending}
            onChange={(e) => run(() => setContentStatusAction(itemId, e.target.value as ContentStatus))}
          >
            {CONTENT_STATUS_ORDER.map((value) => (
              <option key={value} value={value}>
                {CONTENT_STATUS_LABEL[value]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-full border border-danger/30 px-5 py-2.5 text-[14px] font-medium text-danger disabled:opacity-60"
        >
          Excluir
        </button>
      </div>

      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          run(() => addContentCommentAction(itemId, comment), () => setComment(""));
        }}
      >
        <label className="text-[14px] font-medium text-foreground" htmlFor="content-comment">
          Novo comentário
        </label>
        <textarea id="content-comment" className={inputClass} rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
        <button
          type="submit"
          disabled={isPending || !comment.trim()}
          className="neu self-start rounded-full px-5 py-2.5 text-[14px] font-medium text-foreground disabled:opacity-60"
        >
          Comentar
        </button>
      </form>

      {error && <p className="text-[14px] text-danger">{error}</p>}
    </div>
  );
}
