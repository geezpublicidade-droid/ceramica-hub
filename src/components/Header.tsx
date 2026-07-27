"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { MegaMenuItem, type MegaMenuGroup } from "@/components/MegaMenu";
import { AdSlot } from "@/components/ads/AdSlot";

function cat(name: string) {
  return `/preview?categoria=${encodeURIComponent(name)}#empresas`;
}

export function Header() {
  const t = useTranslations("Header");
  const tCategories = useTranslations("categories");

  const megaMenuGroups: MegaMenuGroup[] = [
    {
      key: "corporate",
      label: t("navCorporate"),
      columns: [
        { label: tCategories("Contabilidade & Jurídico"), href: cat("Contabilidade & Jurídico") },
        { label: tCategories("Tecnologia & Marketing"), href: cat("Tecnologia & Marketing") },
        { label: tCategories("Design & Arquitetura"), href: cat("Design & Arquitetura") },
        { label: tCategories("Educação"), href: cat("Educação") },
      ],
      editorial: <AdSlot placementKey="mega_menu_corporate" />,
    },
    {
      key: "lifestyle",
      label: t("navLifestyle"),
      columns: [
        { label: tCategories("Alimentação"), href: cat("Alimentação") },
        { label: tCategories("Saúde & Estética"), href: cat("Saúde & Estética") },
        { label: tCategories("Moda & Beleza"), href: cat("Moda & Beleza") },
      ],
    },
    {
      key: "hoteis",
      label: t("navHoteisEventos"),
      columns: [
        { label: t("catHospedagemCorporativa"), href: "/business-travel" },
        { label: t("catAuditorios"), href: "/auditorios-reunioes" },
        { label: t("catBusinessTravel"), href: "/business-travel" },
      ],
    },
    {
      key: "imobiliarias",
      label: t("navImobiliarias"),
      columns: [
        { label: t("catLocacaoComercial"), href: "/imobiliarias?tipo=locacao" },
        { label: t("catVendaLajes"), href: "/imobiliarias?tipo=venda" },
        { label: t("catSalasDisponiveis"), href: "/imobiliarias" },
      ],
    },
  ];

  const secondaryLinks = [
    { href: "/blog", label: t("navBlog") },
    { href: "/noticias", label: t("navNoticias") },
  ];

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setMenuOpen(false);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border bg-white py-3 sm:py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
        <Link href="/#top" className="shrink-0 text-[17px] font-semibold tracking-tight text-foreground sm:text-[20px]">
          Cerâmica <span className="text-primary">Hub</span>
        </Link>
        <nav className="hidden items-center gap-6 lg:flex xl:gap-8">
          {megaMenuGroups.map((group) => (
            <MegaMenuItem key={group.key} group={group} />
          ))}
          {secondaryLinks.map((link) => (
            <Link key={link.href} href={link.href} className="whitespace-nowrap text-[15px] font-medium text-muted transition-colors hover:text-foreground xl:text-[16px]">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher className="hidden lg:block" />
          <a
            href="/login"
            className="hidden text-[15px] text-muted transition-colors hover:text-foreground lg:block"
          >
            {t("entrar")}
          </a>
          <Link
            href="/cadastro"
            className="neu-primary whitespace-nowrap rounded-full px-3 py-2 text-[14px] font-semibold text-white sm:px-6 sm:py-3 sm:text-[16px]"
          >
            <span className="sm:hidden">{t("cadastrarEmpresaCurto")}</span>
            <span className="hidden sm:inline">{t("cadastrarEmpresa")}</span>
          </Link>
          <button
            type="button"
            aria-label={menuOpen ? t("fecharMenu") : t("abrirMenu")}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.12)] lg:hidden"
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
        <nav className="mx-6 mt-3 flex max-h-[70vh] flex-col gap-1 overflow-y-auto rounded-2xl border border-border bg-white p-3 text-[16px] lg:hidden">
          {megaMenuGroups.map((group) => (
            <div key={group.key} className="border-b border-border pb-2 last:border-0">
              <p className="px-3 pt-2 text-[13px] font-semibold uppercase tracking-wide text-muted">{group.label}</p>
              {group.columns.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-3 py-2.5 text-foreground transition-colors hover:bg-black/5"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
          {secondaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-3 py-2.5 text-foreground transition-colors hover:bg-black/5"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="rounded-xl px-3 py-2.5 text-foreground transition-colors hover:bg-black/5"
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
