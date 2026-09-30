"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAudienceAction } from "@/lib/actions/email-marketing";
import type { Audience } from "@/lib/services/marketing-audiences";

function describeFilters(audience: Audience): string {
  const { categories, plans, towerIds, tags, status, founderOnly, signupFrom, signupTo } = audience.filters;
  const parts = [
    status === "inativo" ? "inativos" : status === "todos" ? "todos os status" : "ativos",
    categories?.length ? `categorias: ${categories.join(", ")}` : null,
    plans?.length ? `planos: ${plans.join(", ")}` : null,
    towerIds?.length ? `${towerIds.length} torre(s)` : null,
    tags?.length ? `tags: ${tags.join(", ")}` : null,
    founderOnly ? "fundadoras" : null,
    signupFrom || signupTo ? `cadastro ${signupFrom ?? "…"} a ${signupTo ?? "…"}` : null,
  ];
  return parts.filter(Boolean).join(" · ");
}

export function AudienceRow({ audience }: { audience: Audience }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!window.confirm(`Excluir o público "${audience.name}"?`)) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteAudienceAction(audience.id);
        if (!result.success) setError(result.error);
        else router.refresh();
      } catch {
        setError("Não foi possível excluir agora.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white/70 px-4 py-3">
      <div className="min-w-0">
        <p className="text-[15px] font-medium text-foreground">{audience.name}</p>
        <p className="text-[13px] text-muted">{describeFilters(audience)}</p>
        {error && <p className="text-[13px] text-danger">{error}</p>}
      </div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="rounded-full border border-danger/30 px-4 py-1.5 text-[13px] font-medium text-danger disabled:opacity-60"
      >
        Excluir
      </button>
    </div>
  );
}
