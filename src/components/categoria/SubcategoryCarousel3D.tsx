"use client";

import { useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { FilterPill } from "./CategoryFilterBar";

type SubcategoryCarousel3DProps = {
  ariaLabel: string;
  prevLabel: string;
  nextLabel: string;
  allLabel: string;
  allHref: string;
  pills: FilterPill[];
  activePillId: string | null;
};

const AUTO_MS = 2600;
const RESUME_MS = 4500;
const MAX_ROTATE = 55;

const PILL_BASE =
  "inline-flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-[14px] [transform-style:preserve-3d] will-change-transform";
const PILL_IDLE = "border-border bg-white text-foreground hover:border-primary/40 hover:text-primary";
const PILL_ACTIVE = "border-primary bg-primary font-medium text-white";

/** Aplica o efeito coverflow: quanto mais longe do centro, mais girado, menor e mais transparente. */
function applyCoverflow(track: HTMLElement, flat: boolean) {
  const center = track.scrollLeft + track.clientWidth / 2;
  const reach = Math.max(track.clientWidth / 2, 1);
  for (const el of Array.from(track.children) as HTMLElement[]) {
    if (el.dataset.pill === undefined) continue;
    if (flat) {
      el.style.transform = "";
      el.style.opacity = "";
      continue;
    }
    const d = Math.max(-1.4, Math.min(1.4, (el.offsetLeft + el.offsetWidth / 2 - center) / reach));
    const abs = Math.abs(d);
    el.style.transform = `translateZ(${(1 - Math.min(abs, 1)) * 40}px) rotateY(${-d * MAX_ROTATE}deg) scale(${1 - abs * 0.18})`;
    el.style.opacity = String(Math.max(0.35, 1 - abs * 0.45));
  }
}

/** Subcategorias num carrossel 3D: gira sozinho, pausa ao tocar/passar o mouse e pode ser arrastado, rolado ou navegado pelas setas. */
export function SubcategoryCarousel3D({
  ariaLabel,
  prevLabel,
  nextLabel,
  allLabel,
  allHref,
  pills,
  activePillId,
}: SubcategoryCarousel3DProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedUntil = useRef(0);
  const hovering = useRef(false);
  const drag = useRef({ active: false, moved: false, startX: 0, startScroll: 0 });
  const reduced = useRef(false);

  const pause = useCallback(() => {
    pausedUntil.current = Date.now() + RESUME_MS;
  }, []);

  const paint = useCallback(() => {
    const track = trackRef.current;
    if (track) applyCoverflow(track, reduced.current);
  }, []);

  const step = useCallback((dir: 1 | -1, loop = false) => {
    const track = trackRef.current;
    if (!track) return;
    const items = Array.from(track.children).filter((c) => (c as HTMLElement).dataset.pill !== undefined) as HTMLElement[];
    const center = track.scrollLeft + track.clientWidth / 2;
    let current = 0;
    let best = Infinity;
    items.forEach((el, i) => {
      const dist = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center);
      if (dist < best) {
        best = dist;
        current = i;
      }
    });
    let target = current + dir;
    if (target >= items.length) target = loop ? 0 : items.length - 1;
    if (target < 0) target = 0;
    const el = items[target];
    track.scrollTo({
      left: el.offsetLeft + el.offsetWidth / 2 - track.clientWidth / 2,
      behavior: reduced.current || (loop && target === 0) ? "auto" : "smooth",
    });
  }, []);

  // posição inicial: centraliza a pílula ativa (ou "Todas")
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const active = track.querySelector<HTMLElement>('[aria-current="page"]');
    if (active) track.scrollLeft = active.offsetLeft + active.offsetWidth / 2 - track.clientWidth / 2;
    paint();
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(paint);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [paint, pills]);

  // rotação automática
  useEffect(() => {
    if (reduced.current) return;
    const id = window.setInterval(() => {
      if (document.hidden || hovering.current || Date.now() < pausedUntil.current) return;
      step(1, true);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [step]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    pause();
    if (e.pointerType !== "mouse" || !trackRef.current) return;
    drag.current = { active: true, moved: false, startX: e.clientX, startScroll: trackRef.current.scrollLeft };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d.active || !trackRef.current) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 5) d.moved = true;
    if (d.moved) trackRef.current.scrollLeft = d.startScroll - dx;
  }

  function endDrag() {
    drag.current.active = false;
    pause();
  }

  // depois de arrastar com o mouse, o clique não deve abrir a subcategoria
  function onClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  }

  const arrow =
    "absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-primary shadow-sm hover:bg-primary hover:text-white sm:flex";

  return (
    <nav
      aria-label={ariaLabel}
      data-reveal
      className="relative"
      onMouseEnter={() => (hovering.current = true)}
      onMouseLeave={() => (hovering.current = false)}
      onFocusCapture={() => (hovering.current = true)}
      onBlurCapture={() => (hovering.current = false)}
    >
      <button
        type="button"
        aria-label={prevLabel}
        onClick={() => {
          pause();
          step(-1);
        }}
        className={`${arrow} left-0`}
      >
        <ChevronLeft aria-hidden="true" className="h-5 w-5" />
      </button>
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        onWheel={pause}
        onClickCapture={onClickCapture}
        className="flex cursor-grab items-center gap-3 overflow-x-auto px-[50%] py-3 [-ms-overflow-style:none] [perspective:900px] [scrollbar-width:none] active:cursor-grabbing sm:px-[45%] [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: "x proximity" }}
      >
        <Link
          data-pill=""
          draggable={false}
          href={allHref}
          aria-current={activePillId === null ? "page" : undefined}
          className={`${PILL_BASE} snap-center ${activePillId === null ? PILL_ACTIVE : PILL_IDLE}`}
        >
          {allLabel}
        </Link>
        {pills.map((pill) => (
          <Link
            key={pill.id}
            data-pill=""
            draggable={false}
            href={pill.href}
            aria-current={activePillId === pill.id ? "page" : undefined}
            className={`${PILL_BASE} snap-center ${activePillId === pill.id ? PILL_ACTIVE : PILL_IDLE}`}
          >
            {pill.label}
          </Link>
        ))}
      </div>
      <button
        type="button"
        aria-label={nextLabel}
        onClick={() => {
          pause();
          step(1);
        }}
        className={`${arrow} right-0`}
      >
        <ChevronRight aria-hidden="true" className="h-5 w-5" />
      </button>
    </nav>
  );
}
