"use client";

import { useEffect, useState } from "react";

const links = [
  { href: "/#empresas", label: "Empresas" },
  { href: "/#oportunidades", label: "Oportunidades" },
  { href: "/#beneficios", label: "Benefícios" },
  { href: "/#planos", label: "Planos" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [scrolled]);

  return (
    <header
      className={`fixed top-0 z-50 w-full border-b transition-all duration-300 ${
        scrolled || menuOpen ? "glass-light border-border py-3" : "border-transparent bg-transparent py-5"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
        <a href="/#top" className="text-[15px] font-semibold tracking-tight text-foreground">
          Cerâmica <span className="text-primary">Hub</span>
        </a>
        <nav className="hidden gap-8 text-[13px] text-muted md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a
            href="/login"
            className="hidden text-[13px] text-muted transition-colors hover:text-foreground md:block"
          >
            Entrar
          </a>
          <a
            href="/cadastro"
            className="neu-primary rounded-full px-4 py-2 text-[13px] font-medium text-white"
          >
            Cadastrar empresa
          </a>
          <button
            type="button"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMenuOpen((v) => !v)}
            className="neu flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground md:hidden"
          >
            {menuOpen ? (
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="glass-light mx-6 mt-3 flex flex-col gap-1 rounded-2xl border border-border p-3 text-[14px] md:hidden">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-3 py-2.5 text-foreground transition-colors hover:bg-white/60"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="rounded-xl px-3 py-2.5 text-foreground transition-colors hover:bg-white/60"
          >
            Entrar
          </a>
        </nav>
      )}
    </header>
  );
}
