"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type DragScrollerProps = {
  children: ReactNode;
  label: string;
  prevLabel: string;
  nextLabel: string;
};

const DRAG_THRESHOLD_PX = 6;
const AUTOPLAY_SPEED_PX_S = 38;
const RESUME_AFTER_MS = 2500;
const COPY_CLASS = "flex shrink-0 gap-3";

const noopSubscribe = () => () => undefined;

/**
 * Faixa horizontal em loop infinito que anda sozinha (devagar), e que o usuário pode arrastar com o mouse, deslizar com o dedo
 * ou avançar pelas setas. O movimento pausa com mouse em cima, foco do teclado, arrasto ou toque, e retoma sozinho em seguida.
 * Quem prefere menos movimento recebe a faixa parada (continua navegável). O clique nos itens funciona; só um arrasto de
 * verdade cancela o clique. O loop usa 3 cópias dos itens: a do meio é a "real", e a posição salta uma cópia (invisível)
 * quando sai dela. As cópias só existem no cliente e ficam fora do foco do teclado e dos leitores de tela.
 */
export function DragScroller({ children, label, prevLabel, nextLabel }: DragScrollerProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const copyA = useRef<HTMLDivElement>(null);
  const copyB = useRef<HTMLDivElement>(null);
  const copyC = useRef<HTMLDivElement>(null);
  const periodRef = useRef(0);
  const hold = useRef({ hover: false, focus: false });
  const drag = useRef({ active: false, moved: false, startX: 0, startScroll: 0 });
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  useEffect(() => {
    const track = trackRef.current;
    const a = copyA.current;
    const b = copyB.current;
    const c = copyC.current;
    if (!mounted || !track || !a || !b || !c) return;

    for (const clone of [b, c]) clone.querySelectorAll<HTMLElement>("a, button").forEach((node) => (node.tabIndex = -1));

    const measure = () => {
      periodRef.current = b.offsetLeft - a.offsetLeft;
    };
    measure();
    track.scrollLeft = periodRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(track);

    let pos = track.scrollLeft;
    let lastRead = track.scrollLeft;
    let resumeAt = 0;
    let last = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;
      const period = periodRef.current;
      if (period > 0) {
        // alguém (mouse, dedo, seta) mexeu na posição: pausa o automático e adota a posição nova
        if (Math.abs(track.scrollLeft - lastRead) > 1.5) {
          resumeAt = now + RESUME_AFTER_MS;
          pos = track.scrollLeft;
        }
        const held = hold.current.hover || hold.current.focus || drag.current.active || now < resumeAt || document.hidden;
        if (held || reduced) pos = track.scrollLeft;
        else pos += (AUTOPLAY_SPEED_PX_S * dt) / 1000;
        if (pos < period) pos += period;
        else if (pos >= 2 * period) pos -= period;
        if (Math.abs(pos - track.scrollLeft) > 0.01) track.scrollLeft = pos;
        lastRead = track.scrollLeft;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
    };
  }, [mounted]);

  const scrollByPage = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return; // toque já rola nativamente
    const el = trackRef.current;
    if (!el) return;
    delete el.dataset.dragged;
    drag.current = { active: true, moved: false, startX: event.clientX, startScroll: el.scrollLeft };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    const state = drag.current;
    if (!state.active || !el) return;
    const delta = event.clientX - state.startX;
    if (!state.moved && Math.abs(delta) > DRAG_THRESHOLD_PX) {
      state.moved = true;
      el.dataset.dragged = "1"; // avisa a transição de página que este clique é fim de arrasto
    }
    if (!state.moved) return;
    // mantém a posição dentro da cópia do meio, deslocando a origem do arrasto junto
    const period = periodRef.current;
    let next = state.startScroll - delta;
    if (period > 0) {
      while (next < period) {
        next += period;
        state.startScroll += period;
      }
      while (next >= 2 * period) {
        next -= period;
        state.startScroll -= period;
      }
    }
    el.scrollLeft = next;
  };

  const endDrag = () => {
    drag.current.active = false;
  };

  // clique logo após um arrasto não deve abrir o link
  const onClickCapture = useCallback((event: React.MouseEvent) => {
    if (drag.current.moved) {
      event.preventDefault();
      event.stopPropagation();
      drag.current.moved = false;
    }
    delete trackRef.current?.dataset.dragged;
  }, []);

  // véu nas pontas: blur + degradê de transparência (profundidade)
  const edge = "pointer-events-none absolute inset-y-0 z-[5] w-16 backdrop-blur-[6px] sm:w-24";
  const arrow = "btn-shine absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-md transition-colors hover:bg-surface sm:flex";

  return (
    <div className="relative w-full" role="group" aria-label={label}>
      <div aria-hidden="true" className={`${edge} left-0 bg-gradient-to-r from-white/90 via-white/50 to-transparent [mask-image:linear-gradient(to_right,black_30%,transparent)]`} />
      <div aria-hidden="true" className={`${edge} right-0 bg-gradient-to-l from-white/90 via-white/50 to-transparent [mask-image:linear-gradient(to_left,black_30%,transparent)]`} />
      <button type="button" aria-label={prevLabel} onClick={() => scrollByPage(-1)} className={`${arrow} left-3`}>
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") hold.current.hover = true;
        }}
        onPointerLeave={() => {
          hold.current.hover = false;
          endDrag();
        }}
        onFocus={() => (hold.current.focus = true)}
        onBlur={() => (hold.current.focus = false)}
        onClickCapture={onClickCapture}
        className={`relative flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab select-none active:cursor-grabbing`}
      >
        <div ref={copyA} className={COPY_CLASS}>
          {children}
        </div>
        {mounted && (
          <>
            <div ref={copyB} aria-hidden="true" className={COPY_CLASS}>
              {children}
            </div>
            <div ref={copyC} aria-hidden="true" className={COPY_CLASS}>
              {children}
            </div>
          </>
        )}
      </div>
      <button type="button" aria-label={nextLabel} onClick={() => scrollByPage(1)} className={`${arrow} right-3`}>
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
