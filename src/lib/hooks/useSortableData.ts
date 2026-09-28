"use client";

import { useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";

/** Ordenação client-side reutilizada pelas tabelas do admin (Empresas,
 * Contatos, Tarefas) -- cada tela só passa um mapa { coluna: comparador } e
 * ganha clique-pra-ordenar sem duplicar o estado de sortKey/direction em
 * cada componente. */
export function useSortableData<T, K extends string>(items: T[], compare: Record<K, (a: T, b: T) => number>) {
  const [sortKey, setSortKey] = useState<K | null>(null);
  const [direction, setDirection] = useState<SortDirection>("asc");

  function toggleSort(key: K) {
    if (sortKey === key) {
      setDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDirection("asc");
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return items;
    const sortedArr = [...items].sort(compare[sortKey]);
    return direction === "asc" ? sortedArr : sortedArr.reverse();
  }, [items, sortKey, direction, compare]);

  return { sorted, sortKey, direction, toggleSort };
}
