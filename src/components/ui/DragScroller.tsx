"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type DragScrollerProps = {
  children: ReactNode;
  label: string;
  prevLabel: string;
  nextLabel: string;
};

const DRAG_THRESHOLD_PX = 6;

/**
 * Faixa horizontal de itens: arrasta com o mouse, desliza com o dedo, tem setas e encaixe (snap).
 * O clique nos itens continua funcionando — só é cancelado quando o gesto foi um arrasto de verdade.
 */
export function DragScroller({ children, label, prevLabel, nextLabel }: DragScrollerProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, moved: false, startX: 0, startScroll: 0 });
  const [edges, setEdges] = useState({ start: true, end: false });
  const [dragging, setDragging] = useState(false);

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateEdges();
    const observer = new ResizeObserver(updateEdges);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateEdges]);

  const scrollByPage = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return; // toque já rola nativamente
    const el = trackRef.current;
    if (!el) return;
    drag.current = { active: true, moved: false, startX: event.clientX, startScroll: el.scrollLeft };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    const state = drag.current;
    if (!state.active || !el) return;
    const delta = event.clientX - state.startX;
    if (!state.moved && Math.abs(delta) > DRAG_THRESHOLD_PX) {
      state.moved = true;
      setDragging(true);
    }
    if (state.moved) el.scrollLeft = state.startScroll - delta;
  };

  const endDrag = () => {
    drag.current.active = false;
    setDragging(false);
  };

  // clique logo após um arrasto não deve abrir o link
  const onClickCapture = (event: React.MouseEvent) => {
    if (drag.current.moved) {
      event.preventDefault();
      event.stopPropagation();
      drag.current.moved = false;
    }
  };

  const arrow = "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-md transition-opacity hover:bg-surface disabled:pointer-events-none disabled:opacity-0 sm:flex";

  return (
    <div className="relative" role="group" aria-label={label}>
      <button type="button" aria-label={prevLabel} disabled={edges.start} onClick={() => scrollByPage(-1)} className={`${arrow} -left-3`}>
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <div
        ref={trackRef}
        onScroll={updateEdges}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        className={`flex gap-3 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${dragging ? "cursor-grabbing snap-none select-none" : "cursor-grab snap-x snap-mandatory"}`}
      >
        {children}
      </div>
      <button type="button" aria-label={nextLabel} disabled={edges.end} onClick={() => scrollByPage(1)} className={`${arrow} -right-3`}>
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
