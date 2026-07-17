"use client";

import { useEffect, useState } from "react";

const links = [
  { href: "#empresas", label: "Empresas" },
  { href: "#oportunidades", label: "Oportunidades" },
  { href: "#beneficios", label: "Benefícios" },
  { href: "#planos", label: "Planos" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 z-50 w-full border-b transition-all duration-300 ${
        scrolled ? "glass-light border-border py-3" : "border-transparent bg-transparent py-5"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
        <a href="#top" className="text-[15px] font-semibold tracking-tight text-foreground">
          Cerâmica <span className="text-primary">Hub</span>
        </a>
        <nav className="hidden gap-8 text-[13px] text-muted md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
        <a
          href="#cadastro"
          className="rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-85"
        >
          Cadastrar empresa
        </a>
      </div>
    </header>
  );
}
