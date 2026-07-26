"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Header() {
  const t = useTranslations("Header");
  const links = [
    { href: "/#empresas", label: t("navEmpresas") },
    { href: "/#oportunidades", label: t("navOportunidades") },
    { href: "/#beneficios", label: t("navBeneficios") },
    { href: "/#planos", label: t("navPlanos") },
  ];
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
      className={`fixed top-0 z-50 w-full border-b py-3 transition-all duration-300 sm:py-4 ${
        scrolled || menuOpen
          ? "glass-light border-border"
          : "border-transparent bg-white/70 backdrop-blur-md md:bg-transparent md:py-5 md:backdrop-blur-none"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
        <Link href="/#top" className="text-[17px] font-semibold tracking-tight text-foreground">
          Cerâmica <span className="text-primary">Hub</span>
        </Link>
        <nav className="hidden gap-8 text-[15px] text-muted md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSwitcher className="hidden md:flex" />
          <a
            href="/login"
            className="hidden text-[15px] text-muted transition-colors hover:text-foreground md:block"
          >
            {t("entrar")}
          </a>
          <Link
            href="/cadastro"
            className="neu-primary whitespace-nowrap rounded-full px-3 py-2 text-[14px] font-medium text-white sm:px-4 sm:text-[15px]"
          >
            {t("cadastrarEmpresa")}
          </Link>
          <button
            type="button"
            aria-label={menuOpen ? t("fecharMenu") : t("abrirMenu")}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.12)] md:hidden"
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
        <nav className="glass-light mx-6 mt-3 flex flex-col gap-1 rounded-2xl border border-border p-3 text-[16px] md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-3 py-2.5 text-foreground transition-colors hover:bg-white/60"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="rounded-xl px-3 py-2.5 text-foreground transition-colors hover:bg-white/60"
          >
            {t("entrar")}
          </a>
          <div className="mt-2 border-t border-border pt-2">
            <LanguageSwitcher />
          </div>
        </nav>
      )}
    </header>
  );
}
