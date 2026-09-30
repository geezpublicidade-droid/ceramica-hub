"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AdminSearchResult } from "@/lib/services/admin-search";

const DEBOUNCE_MS = 250;
const MIN_TERM_LENGTH = 2;

type SearchState = { term: string; results: AdminSearchResult[]; failed: boolean };

/** Resultados da busca global (empresas, contatos, leads, tarefas, propostas)
 * abaixo do campo de busca do menu. Consulta /api/admin/search com debounce;
 * descarta respostas de termos já superados. */
export function AdminGlobalResults({ term, onNavigate }: { term: string; onNavigate: () => void }) {
  const [state, setState] = useState<SearchState | null>(null);
  const active = term.length >= MIN_TERM_LENGTH;

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/admin/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (!response.ok) throw new Error(String(response.status));
        const body = (await response.json()) as { results: AdminSearchResult[] };
        setState({ term, results: body.results, failed: false });
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setState({ term, results: [], failed: true });
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, active]);

  if (!active) return null;
  if (!state || state.term !== term) return <p className="px-1 text-[13px] text-muted">Buscando…</p>;
  if (state.failed) return <p className="px-1 text-[13px] text-danger">Não foi possível buscar agora.</p>;
  if (state.results.length === 0) return null;

  const groups = new Map<string, AdminSearchResult[]>();
  for (const result of state.results) {
    groups.set(result.group, [...(groups.get(result.group) ?? []), result]);
  }

  return (
    <div className="flex flex-col gap-2 border-b border-border pb-3">
      {Array.from(groups).map(([group, items]) => (
        <div key={group} className="flex flex-col gap-0.5">
          <p className="px-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted/70">{group}</p>
          {items.map((item) => (
            <Link
              key={`${item.group}-${item.id}`}
              href={item.href}
              onClick={onNavigate}
              className="flex flex-col rounded-xl px-3.5 py-2 transition-colors hover:bg-black/5"
            >
              <span className="text-[14px] font-medium text-foreground">{item.title}</span>
              {item.subtitle && <span className="truncate text-[12px] text-muted">{item.subtitle}</span>}
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
