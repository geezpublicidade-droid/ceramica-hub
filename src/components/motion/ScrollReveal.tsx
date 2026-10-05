"use client";

import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";

/** Elementos revelados: marcados com `data-reveal` ou filhos diretos de `data-reveal-group` (escalonamento no CSS). */
const SELECTOR = "[data-reveal], [data-reveal-group] > *";
/** espera a hidratação terminar antes de tocar no DOM do React (evita aviso de hidratação) */
const SETTLE_MS = 400;

/**
 * Revela elementos ao entrarem na tela: fade + blur + subida suave (CSS em globals.css).
 * O que já está visível no carregamento não é escondido (sem piscar); sem IntersectionObserver
 * ou com "reduzir movimento" nada é escondido.
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    const seen = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    const track = (scope: ParentNode, initial: boolean) => {
      scope.querySelectorAll(SELECTOR).forEach((el) => {
        if (seen.has(el) || el.classList.contains("in")) return;
        seen.add(el);
        const rect = el.getBoundingClientRect();
        if (initial && rect.top < window.innerHeight && rect.bottom > 0) el.classList.add("in");
        else observer.observe(el);
      });
    };

    let mutations: MutationObserver | undefined;
    const start = () => {
      track(document, true);
      root.classList.add("js-reveal");
      mutations = new MutationObserver((records) => {
        for (const record of records) {
          record.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) track(node.parentElement ?? document, false);
          });
        }
      });
      mutations.observe(document.body, { childList: true, subtree: true });
    };

    const timer = window.setTimeout(start, SETTLE_MS);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      mutations?.disconnect();
      root.classList.remove("js-reveal");
    };
  }, [pathname]);

  return null;
}
