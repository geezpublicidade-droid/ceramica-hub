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
        <a
          href="#top"
          className={`text-[15px] font-semibold tracking-tight transition-colors ${
            scrolled ? "text-foreground" : "text-white"
          }`}
        >
          Cerâmica <span className="text-connection">Hub</span>
        </a>
        <nav
          className={`hidden gap-8 text-[13px] transition-colors md:flex ${
            scrolled ? "text-muted" : "text-white/60"
          }`}
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`transition-colors ${scrolled ? "hover:text-foreground" : "hover:text-white"}`}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <a
          href="#cadastro"
          className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
            scrolled
              ? "bg-foreground text-white hover:opacity-80"
              : "bg-white text-black hover:bg-white/85"
          }`}
        >
          Cadastrar empresa
        </a>
      </div>
    </header>
  );
}
