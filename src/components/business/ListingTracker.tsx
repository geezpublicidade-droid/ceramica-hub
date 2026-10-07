"use client";

import { useEffect } from "react";
import { logListingClick, logListingImpressions, type ListingContextInput, type ListingEntry } from "@/lib/actions/log-search";

/**
 * Mede a presença das empresas nas listagens: registra a IMPRESSÃO quando o cartão fica ao menos 50% visível (uma vez por
 * carregamento) e o CLIQUE no cartão, sempre com posição, plano, categoria e origem. Os cartões se identificam por
 * `data-imp-id`, `data-imp-pos` e `data-imp-plan`. Não guarda dado pessoal: só a empresa e o contexto da listagem.
 */
export function ListingTracker({ origin, category, query }: ListingContextInput) {
  useEffect(() => {
    const context: ListingContextInput = { origin, category, query };
    const entryOf = (el: HTMLElement): ListingEntry => ({ businessId: el.dataset.impId ?? "", position: Number(el.dataset.impPos), plan: el.dataset.impPlan ?? "" });
    const queue: ListingEntry[] = [];
    const seen = new Set<string>();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const flush = () => {
      if (queue.length > 0) void logListingImpressions(queue.splice(0, queue.length), context).catch(() => undefined);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const item of entries) {
          const el = item.target as HTMLElement;
          if (!item.isIntersecting || seen.has(el.dataset.impId ?? "")) continue;
          seen.add(el.dataset.impId ?? "");
          queue.push(entryOf(el));
          observer.unobserve(el);
        }
        clearTimeout(timer);
        timer = setTimeout(flush, 800);
      },
      { threshold: 0.5 },
    );
    document.querySelectorAll<HTMLElement>("[data-imp-id]").forEach((el) => observer.observe(el));

    const onClick = (event: MouseEvent) => {
      const el = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-imp-id]");
      if (el) void logListingClick(entryOf(el), context).catch(() => undefined);
    };
    document.addEventListener("click", onClick);
    window.addEventListener("pagehide", flush);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      document.removeEventListener("click", onClick);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [origin, category, query]);

  return null;
}
