"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";

type FilterDrawerProps = {
  title: string;
  triggerLabel: string;
  closeLabel: string;
  /** filtros ativos: vira o contador no botão e o destaca */
  activeCount: number;
  /** formulário de filtros (renderizado no servidor) */
  children: ReactNode;
};

/** Painel lateral de filtros avançados (tela cheia no celular); Esc e clique fora fecham. */
export function FilterDrawer({ title, triggerLabel, closeLabel, activeCount, children }: FilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full border bg-white px-4 text-[15px] font-medium transition-colors hover:border-primary/50 ${
          activeCount > 0 ? "border-primary text-primary" : "border-border text-foreground"
        }`}
      >
        <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
        {triggerLabel}
        {activeCount > 0 && (
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-[12px] font-semibold text-white">
            {activeCount}
          </span>
        )}
      </button>

      <div
        aria-hidden={!open}
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-hidden={!open}
        inert={!open}
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[18px] font-semibold tracking-tight">{title}</h2>
          <button
            ref={closeRef}
            type="button"
            aria-label={closeLabel}
            onClick={() => setOpen(false)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-black/5 hover:text-foreground"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </>
  );
}
