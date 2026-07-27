"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";

export type MegaMenuLink = { label: string; href: string };

export type MegaMenuGroup = {
  key: string;
  label: string;
  columns: MegaMenuLink[];
  /** Slot livre pra área editorial (ex: AdSlot de "empresa VIP em destaque") -- só passa quando quiser mostrar. */
  editorial?: React.ReactNode;
};

/**
 * Menu no hover, foco de teclado ou clique -- não depende só de hover
 * (precisa funcionar em telas de toque). Fecha com Esc, clique fora, ou
 * perda de foco. Nunca ocupa a tela inteira.
 */
export function MegaMenuItem({ group }: { group: MegaMenuGroup }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`mega-menu-${group.key}`}
        onClick={() => setOpen((v) => !v)}
        className="whitespace-nowrap py-2 text-[15px] font-medium text-muted transition-colors hover:text-foreground xl:text-[16px]"
      >
        {group.label}
      </button>

      {open && (
        <div
          id={`mega-menu-${group.key}`}
          role="region"
          aria-label={group.label}
          className="absolute left-1/2 top-full z-40 w-[320px] -translate-x-1/2 pt-3"
        >
          <div className="rounded-2xl border border-border bg-white p-2 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.25)]">
            <nav className="flex flex-col gap-0.5">
              {group.columns.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-[14px] text-foreground transition-colors hover:bg-black/5"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            {group.editorial && <div className="mt-1 border-t border-border pt-2">{group.editorial}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
