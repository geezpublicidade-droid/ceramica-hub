"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AdminRole } from "@/auth";
import { IconOverview, IconSupport } from "@/components/dashboard/nav-icons";
import {
  IconFinance,
  IconLgpd,
  IconAds,
  IconBlog,
  IconPartners,
  IconLeads,
  IconHotels,
  IconAuditoriums,
  IconRealEstate,
  IconEvents,
  IconReviews,
  IconUsers,
  IconCompanies,
  IconContacts,
  IconTasks,
  IconResults,
} from "@/components/admin/admin-nav-icons";

type NavItem = {
  label: string;
  href: string;
  Icon: typeof IconOverview;
  roles: AdminRole[];
};

/** As 8 áreas do painel administrativo (ver prompt mestre da reforma do
 * admin): cada item entra em uma única área, na ordem em que aparecem aqui.
 * Uma área sem nenhum item visível pro papel atual simplesmente não
 * renderiza (ver filtro em AdminNav). */
const NAV_SECTIONS: { section: string; items: NavItem[] }[] = [
  {
    section: "Visão geral",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        Icon: IconOverview,
        roles: ["super_admin", "admin", "moderador", "analista"],
      },
    ],
  },
  {
    section: "Comercial",
    items: [
      {
        label: "Leads",
        href: "/admin/leads",
        Icon: IconLeads,
        roles: ["super_admin", "admin", "comercial"],
      },
      {
        label: "Empresas",
        href: "/admin/empresas",
        Icon: IconCompanies,
        roles: [
          "super_admin",
          "admin",
          "moderador",
          "comercial",
          "financeiro",
          "marketing",
          "atendimento",
          "analista",
        ],
      },
      {
        label: "Contatos",
        href: "/admin/contatos",
        Icon: IconContacts,
        roles: ["super_admin", "admin", "comercial", "atendimento"],
      },
      {
        label: "Tarefas",
        href: "/admin/tarefas",
        Icon: IconTasks,
        roles: [
          "super_admin",
          "admin",
          "comercial",
          "atendimento",
          "marketing",
          "financeiro",
        ],
      },
      {
        label: "Propostas",
        href: "/admin/propostas",
        Icon: IconLeads,
        roles: ["super_admin", "admin", "comercial"],
      },
      {
        label: "Produtos",
        href: "/admin/produtos",
        Icon: IconAds,
        roles: ["super_admin", "admin", "comercial", "financeiro"],
      },
      {
        label: "Parceiros",
        href: "/admin/parceiros",
        Icon: IconPartners,
        roles: ["super_admin", "admin", "comercial"],
      },
    ],
  },
  {
    section: "Operação",
    items: [
      {
        label: "Avaliações",
        href: "/admin/avaliacoes",
        Icon: IconReviews,
        roles: ["super_admin", "admin", "moderador", "conteudo"],
      },
      {
        label: "Eventos",
        href: "/admin/eventos",
        Icon: IconEvents,
        roles: ["super_admin", "admin", "marketing", "conteudo"],
      },
      {
        label: "Hotéis",
        href: "/admin/hoteis",
        Icon: IconHotels,
        roles: ["super_admin", "admin"],
      },
      {
        label: "Auditórios",
        href: "/admin/auditorios",
        Icon: IconAuditoriums,
        roles: ["super_admin", "admin"],
      },
      {
        label: "Imobiliárias",
        href: "/admin/imobiliarias",
        Icon: IconRealEstate,
        roles: ["super_admin", "admin"],
      },
    ],
  },
  {
    section: "Marketing",
    items: [
      {
        label: "Publicidade",
        href: "/admin/publicidade",
        Icon: IconAds,
        roles: ["super_admin", "admin", "comercial", "marketing"],
      },
      {
        label: "Blog",
        href: "/admin/blog",
        Icon: IconBlog,
        roles: ["super_admin", "admin", "marketing", "conteudo"],
      },
    ],
  },
  {
    section: "Financeiro",
    items: [
      {
        label: "Financeiro",
        href: "/admin/financeiro",
        Icon: IconFinance,
        roles: ["super_admin", "admin", "financeiro"],
      },
    ],
  },
  {
    section: "Resultados",
    items: [
      {
        label: "Resultados",
        href: "/admin/resultados",
        Icon: IconResults,
        roles: ["super_admin", "admin", "marketing", "analista"],
      },
    ],
  },
  {
    section: "Atendimento",
    items: [
      {
        label: "Suporte",
        href: "/admin/suporte",
        Icon: IconSupport,
        roles: [
          "super_admin",
          "admin",
          "moderador",
          "financeiro",
          "comercial",
          "atendimento",
        ],
      },
    ],
  },
  {
    section: "Configurações",
    items: [
      {
        label: "Usuários",
        href: "/admin/usuarios",
        Icon: IconUsers,
        roles: ["super_admin"],
      },
      {
        label: "LGPD",
        href: "/admin/lgpd",
        Icon: IconLgpd,
        roles: ["super_admin", "admin"],
      },
    ],
  },
];

function isItemActive(href: string, currentPath: string): boolean {
  if (href === "/admin") return currentPath === "/admin";
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

const COLLAPSE_STORAGE_KEY = "admin-nav-collapsed-sections";

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      className="h-4 w-4 shrink-0"
    >
      <path d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13" />
    </svg>
  );
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-3.5 w-3.5 shrink-0 transition-transform ${collapsed ? "-rotate-90" : ""}`}
    >
      <path d="M5.5 7.5l4.5 5 4.5-5" />
    </svg>
  );
}

/** Nav do painel administrativo, mesmo estilo CRM do DashboardNav da empresa
 * (ver dashboard/DashboardNav.tsx): ícone + rótulo, item ativo com
 * preenchimento sólido terracota, agrupado nas 8 áreas do prompt mestre da
 * reforma do admin (Visão Geral/Comercial/Operação/Marketing/Financeiro/
 * Resultados/Atendimento/Configurações). Cada item aqui é uma rota própria
 * (não seções #hash de uma mesma página), então o item ativo é só o path
 * atual -- sem precisar de IntersectionObserver. Rotas com sub-página (ex:
 * /admin/suporte/<id>, /admin/publicidade/espacos, /admin/empresas/<id>)
 * continuam acendendo o item pai via startsWith. Cada papel (AdminRole) só
 * vê as seções e itens que pode acessar.
 *
 * Grupos são recolhíveis (só no layout desktop -- no mobile a nav já é uma
 * fita horizontal por seção, recolher não ajudaria) e o estado fica em
 * localStorage por navegador/viewer, não é dado de servidor. A busca no topo
 * filtra os itens do menu pelo rótulo (client-side, sobre a lista fixa de
 * páginas -- não bate no banco). */
export function AdminNav({
  currentPath,
  adminRole,
}: {
  currentPath: string;
  adminRole: AdminRole;
}) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Leitura única de localStorage no mount -- não dá pra saber o valor no
    // server (mismatch de hidratação se lido direto no useState inicial), e
    // não há evento de storage pra assinar (é o próprio componente que
    // escreve). Efeito clássico de "sincronizar com sistema externo" que a
    // regra abaixo não reconhece por ser condicional.
    try {
      const raw = localStorage.getItem(COLLAPSE_STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setCollapsed(new Set(JSON.parse(raw) as string[]));
    } catch {
      // localStorage indisponível (aba privada, storage bloqueado) -- segue com tudo expandido.
    }
  }, []);

  function toggleSection(section: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      try {
        localStorage.setItem(
          COLLAPSE_STORAGE_KEY,
          JSON.stringify(Array.from(next)),
        );
      } catch {
        // idem -- só não persiste entre sessões.
      }
      return next;
    });
  }

  const term = search.trim().toLowerCase();
  const isSearching = term.length > 0;

  const sections = useMemo(() => {
    return NAV_SECTIONS.map((group) => ({
      section: group.section,
      items: group.items.filter(
        (item) =>
          item.roles.includes(adminRole) &&
          (!term || item.label.toLowerCase().includes(term)),
      ),
    })).filter((group) => group.items.length > 0);
  }, [adminRole, term]);

  const currentLabel =
    NAV_SECTIONS.flatMap((group) => group.items).find((item) =>
      isItemActive(item.href, currentPath),
    )?.label ?? "Painel";

  return (
    <nav className="flex flex-col gap-3 rounded-2xl border border-border bg-white/70 p-2 lg:rounded-3xl lg:p-3">
      <button
        type="button"
        onClick={() => setMobileOpen((open) => !open)}
        aria-expanded={mobileOpen}
        className="flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 text-[14px] font-medium text-foreground lg:hidden"
      >
        <span className="flex items-center gap-2.5">
          <MenuIcon />
          {currentLabel}
        </span>
        <ChevronIcon collapsed={!mobileOpen} />
      </button>

      <div
        className={`${mobileOpen ? "flex" : "hidden"} flex-col gap-3 lg:flex`}
      >
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar no menu..."
          className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-base text-foreground outline-none focus:border-primary lg:py-2 lg:text-[13px]"
        />

        {sections.length === 0 && (
          <p className="px-1 text-[13px] text-muted">
            Nada encontrado para &quot;{search}&quot;.
          </p>
        )}

        {sections.map((group) => {
          const isCollapsed = !isSearching && collapsed.has(group.section);
          return (
            <div key={group.section} className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => toggleSection(group.section)}
                className="hidden items-center justify-between gap-2 px-3.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted/70 transition-colors hover:text-foreground lg:flex"
              >
                {group.section}
                <ChevronIcon collapsed={isCollapsed} />
              </button>
              <p className="px-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted/70 lg:hidden">
                {group.section}
              </p>
              <div
                className={`flex flex-wrap gap-1.5 lg:flex-col lg:flex-nowrap lg:gap-1 ${isCollapsed ? "lg:hidden" : ""}`}
              >
                {group.items.map(({ label, href, Icon }) => {
                  const isActive = isItemActive(href, currentPath);
                  return (
                    <Link
                      key={label}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex min-h-11 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-white shadow-[0_6px_16px_-6px_rgba(227,83,54,0.55)]"
                          : "text-muted hover:bg-black/5 hover:text-foreground"
                      }`}
                    >
                      <Icon />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
