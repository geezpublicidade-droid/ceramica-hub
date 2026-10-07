"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const COVER_MS = 650;
const REVEAL_MS = 750;
const REVEAL_DELAY_MS = 120;
const NAVIGATION_TIMEOUT_MS = 5000;
const EASE = "cubic-bezier(.7,0,.2,1)";

type Origin = { x: number; y: number; radius: number };

const circle = (radius: number, { x, y }: Origin) => `circle(${radius}px at ${x}px ${y}px)`;

/** Raio que cobre a tela inteira a partir do ponto (x, y): distância até o canto mais distante. */
function coverRadius(x: number, y: number): number {
  return Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
}

/** Link interno que deve ganhar a transição? (mesma origem, mesma aba, sem tecla modificadora, rota diferente) */
function internalTarget(event: MouseEvent): { href: string; anchor: HTMLAnchorElement } | null {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
  if (!anchor || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download") || anchor.dataset.noTransition !== undefined || anchor.closest("[data-dragged='1']")) return null;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin || url.pathname === window.location.pathname || url.pathname.startsWith("/api/")) return null;
  return { href: url.pathname + url.search + url.hash, anchor };
}

/**
 * Transição entre páginas: ao clicar num link interno, um círculo terracota nasce no ponto do clique, cresce até cobrir a
 * tela (com um anel fino na borda) e só então a navegação acontece; quando a página nova monta, o círculo recolhe de volta
 * para o ponto do clique revelando a página. Respeita "reduzir movimento" (navega normal) e nunca trava a navegação:
 * se a rota não mudar em 5s, o véu se desfaz sozinho.
 */
export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const veilRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const origin = useRef<Origin | null>(null);
  const waiting = useRef(false);
  const fallback = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastPath = useRef(pathname);

  const reveal = useCallback(() => {
    const veil = veilRef.current;
    const from = origin.current;
    if (!veil || !from) return;
    waiting.current = false;
    clearTimeout(fallback.current);
    const anim = veil.animate([{ clipPath: circle(from.radius, from) }, { clipPath: circle(0, from) }], {
      duration: REVEAL_MS,
      delay: REVEAL_DELAY_MS,
      easing: EASE,
      fill: "both",
    });
    anim.onfinish = () => {
      veil.style.visibility = "hidden";
      anim.cancel();
    };
  }, []);

  // a rota mudou enquanto o véu estava fechado: abre
  useEffect(() => {
    if (pathname !== lastPath.current) {
      lastPath.current = pathname;
      if (waiting.current) reveal();
    }
  }, [pathname, reveal]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = internalTarget(event);
      const veil = veilRef.current;
      const ring = ringRef.current;
      if (!target || !veil || !ring || waiting.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      // fase de captura: chega antes do <Link> do Next, que também navegaria
      event.preventDefault();
      event.stopPropagation();
      const rect = target.anchor.getBoundingClientRect();
      // clique por teclado não tem coordenada: usa o centro do link
      const x = event.clientX || rect.left + rect.width / 2;
      const y = event.clientY || rect.top + rect.height / 2;
      const radius = coverRadius(x, y);
      const from: Origin = { x, y, radius };
      origin.current = from;
      waiting.current = true;

      veil.style.visibility = "visible";
      ring.style.width = ring.style.height = `${radius * 2}px`;
      const ringPos = `translate(${x - radius}px, ${y - radius}px)`;
      ring.animate(
        [
          { transform: `${ringPos} scale(0)`, opacity: 1 },
          { opacity: 1, offset: 0.75 },
          { transform: `${ringPos} scale(1)`, opacity: 0 },
        ],
        { duration: COVER_MS, easing: EASE, fill: "both" },
      );
      const cover = veil.animate([{ clipPath: circle(0, from) }, { clipPath: circle(radius, from) }], { duration: COVER_MS, easing: EASE, fill: "both" });
      cover.onfinish = () => {
        router.push(target.href);
        fallback.current = setTimeout(reveal, NAVIGATION_TIMEOUT_MS);
      };
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimeout(fallback.current);
    };
  }, [router, reveal]);

  return (
    <>
      <div ref={veilRef} aria-hidden="true" style={{ visibility: "hidden", clipPath: "circle(0px at 0 0)" }} className="pointer-events-none fixed inset-0 z-[9999] bg-primary" />
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[10000] rounded-full border border-white/70 opacity-0"
      />
    </>
  );
}
