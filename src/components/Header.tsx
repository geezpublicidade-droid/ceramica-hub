"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import NextLink from "next/link";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { GlobalSearchOverlay } from "@/components/GlobalSearchOverlay";
import {
  Anchor, BadgeDollarSign, BedDouble, BookOpen, Building2, DoorOpen, KeyRound, LayoutGrid,
  LineChart, Newspaper, Plane, Presentation, UserPlus, Users, type LucideIcon,
} from "lucide-react";
import { categories } from "@/data/businesses";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { slugFromCategory } from "@/lib/category-slug";

type MenuLink = { href: string; label: string; Icon: LucideIcon };
type MenuGroup = { key: string; label: string; links: MenuLink[] };

const realCategories = categories.filter((name) => name !== "Todas");

function cat(name: string) {
  return `/categoria/${slugFromCategory(name)}`;
}

export function Header() {
  const t = useTranslations("Header");
  const tCategories = useTranslations("categories");
  const tSearch = useTranslations("GlobalSearch");

  const menuGroups: MenuGroup[] = [
    {
      key: "categorias",
      label: t("navCategorias"),
      links: realCategories.map((name) => ({
        href: cat(name),
        label: tCategories(name),
        Icon: CATEGORY_ICONS[name] ?? LayoutGrid,
      })),
    },
    {
      key: "hoteis",
      label: t("navHoteisEventos"),
      links: [
        { href: "/business-travel", label: t("catHospedagemCorporativa"), Icon: BedDouble },
        { href: "/auditorios-reunioes", label: t("catAuditorios"), Icon: Presentation },
        { href: "/business-travel", label: t("catBusinessTravel"), Icon: Plane },
      ],
    },
    {
      key: "imobiliarias",
      label: t("navImobiliarias"),
      links: [
        { href: "/imobiliarias?tipo=locacao", label: t("catLocacaoComercial"), Icon: KeyRound },
        { href: "/imobiliarias?tipo=venda", label: t("catVendaLajes"), Icon: Building2 },
        { href: "/imobiliarias", label: t("catSalasDisponiveis"), Icon: DoorOpen },
      ],
    },
    {
      key: "portal",
      label: "Cerâmica Hub",
      links: [
        { href: "/parceiros", label: t("navAncoras"), Icon: Anchor },
        { href: "/forum-de-negocios", label: t("navForum"), Icon: Users },
        { href: "/planos", label: t("navPlanos"), Icon: BadgeDollarSign },
        { href: "/blog", label: t("navBlog"), Icon: BookOpen },
        { href: "/noticias", label: t("navNoticias"), Icon: Newspaper },
        { href: "/impacto", label: t("navImpacto"), Icon: LineChart },
      ],
    },
  ];

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setMenuOpen(false);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [menuOpen]);

  return (
    <header className="fixed top-0 z-50 flex h-16 w-full items-center border-b border-border/60 bg-white/75 backdrop-blur-xl backdrop-saturate-150 transition-colors duration-500 sm:h-[76px]">
      <div className="container-page flex items-center justify-between gap-4">
        <Link href="/#top" className="flex shrink-0 items-center gap-2 py-2 text-[15px] font-semibold tracking-tight text-foreground min-[360px]:text-[17px] sm:text-[20px]">
          <img src="/images/logo-ceramica-hub.png" alt="" className="h-6 w-6 min-[360px]:h-7 min-[360px]:w-7 sm:h-8 sm:w-8" />
          Cerâmica <span className="text-primary">Hub</span>
        </Link>

        <div className="flex items-center gap-1 min-[360px]:gap-2 sm:gap-3">
          <button
            type="button"
            aria-label={tSearch("openSearch")}
            onClick={() => setSearchOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-black/5 hover:text-foreground"
          >
            <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M14 14L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <NextLink
            href="/entrar"
            aria-label={t("entrar")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground sm:h-auto sm:w-auto sm:gap-1.5 neu sm:rounded-full sm:px-4 sm:py-2 sm:text-[14px] sm:font-medium sm:text-foreground"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:hidden">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
            </svg>
            <span className="hidden sm:inline">{t("entrar")}</span>
          </NextLink>
          <LanguageSwitcher className="hidden sm:block" />
          <Link
            href="/cadastro"
            className="hidden whitespace-nowrap neu-primary rounded-full px-4 py-2 text-[14px] font-medium text-white sm:inline-block sm:px-5 sm:py-2.5 sm:text-[15px]"
          >
            {t("cadastrarEmpresa")}
          </Link>
          <button
            type="button"
            aria-label={menuOpen ? t("fecharMenu") : t("abrirMenu")}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.12)]"
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

      {/* backdrop */}
      <div
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* lateral drawer */}
      <nav
        aria-hidden={!menuOpen}
        className={`fixed right-0 top-0 z-50 flex h-full w-[85%] max-w-sm flex-col overflow-y-auto bg-white p-4 text-[16px] shadow-2xl transition-transform duration-300 ease-out ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-2 flex items-center justify-between">
          <Link
            href="/#top"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 py-1.5 text-[17px] font-semibold tracking-tight text-foreground"
          >
            <img src="/images/logo-ceramica-hub.png" alt="" className="h-7 w-7" />
            Cerâmica <span className="text-primary">Hub</span>
          </Link>
          <button
            type="button"
            aria-label={t("fecharMenu")}
            onClick={() => setMenuOpen(false)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-black/5 hover:text-foreground"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-1">
          {menuGroups.map((group) => (
            <div key={group.key} className="border-b border-border pb-2 last:border-0">
              <p className="px-3 pt-2 text-[13px] font-semibold uppercase tracking-wide text-muted">{group.label}</p>
              {group.links.map(({ href, label, Icon }) => (
                <Link
                  key={href + label}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-foreground transition-colors hover:bg-black/5"
                >
                  <Icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0 text-primary" strokeWidth={1.6} />
                  {label}
                </Link>
              ))}
            </div>
          ))}
          <Link
            href="/cadastro"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-foreground transition-colors hover:bg-black/5"
          >
            <UserPlus aria-hidden="true" className="h-[18px] w-[18px] shrink-0 text-primary" strokeWidth={1.6} />
            {t("cadastrarEmpresa")}
          </Link>
        </div>
        <div className="mt-2 border-t border-border pt-3">
          <LanguageSwitcher />
        </div>
      </nav>

      <GlobalSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
