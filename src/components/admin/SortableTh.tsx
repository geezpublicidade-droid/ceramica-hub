"use client";

import type { SortDirection } from "@/lib/hooks/useSortableData";

/** Cabeçalho de coluna clicável, compartilhado pelas tabelas do admin
 * (Empresas, Contatos, Tarefas) junto com useSortableData. */
export function SortableTh({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  className,
}: {
  label: string;
  sortKey: string;
  activeKey: string | null;
  direction: SortDirection;
  onSort: (key: string) => void;
  className?: string;
}) {
  const isActive = activeKey === sortKey;
  return (
    <th className={`px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted ${className ?? ""}`}>
      <button type="button" onClick={() => onSort(sortKey)} className="flex items-center gap-1 whitespace-nowrap hover:text-foreground">
        {label}
        <span className={`text-[10px] ${isActive ? "opacity-100" : "opacity-0"}`}>{direction === "asc" ? "▲" : "▼"}</span>
      </button>
    </th>
  );
}
