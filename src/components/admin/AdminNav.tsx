"use client";

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
} from "@/components/admin/admin-nav-icons";

type NavItem = { label: string; href: string; Icon: typeof IconOverview; roles: AdminRole[] };

/** As 8 áreas do painel administrativo (ver prompt mestre da reforma do
 * admin): cada item entra em uma única área, na ordem em que aparecem aqui.
 * Uma área sem nenhum item visível pro papel atual simplesmente não
 * renderiza (ver filtro em AdminNav) -- não existe ainda página própria de
 * "Resultados" (analytics/relatórios ficou pra fase 4), por isso essa área
 * não aparece na lista abaixo. */
const NAV_SECTIONS: { section: string; items: NavItem[] }[] = [
  {
    section: "Visão geral",
    items: [{ label: "Dashboard", href: "/admin", Icon: IconOverview, roles: ["super_admin", "admin", "moderador", "analista"] }],
  },
  {
    section: "Comercial",
    items: [
      { label: "Leads", href: "/admin/leads", Icon: IconLeads, roles: ["super_admin", "admin", "comercial"] },
      {
        label: "Empresas",
        href: "/admin/empresas",
        Icon: IconCompanies,
        roles: ["super_admin", "admin", "moderador", "comercial", "financeiro", "marketing", "atendimento", "analista"],
      },
      { label: "Contatos", href: "/admin/contatos", Icon: IconContacts, roles: ["super_admin", "admin", "comercial", "atendimento"] },
      {
        label: "Tarefas",
        href: "/admin/tarefas",
        Icon: IconTasks,
        roles: ["super_admin", "admin", "comercial", "atendimento", "marketing", "financeiro"],
      },
      { label: "Parceiros", href: "/admin/parceiros", Icon: IconPartners, roles: ["super_admin", "admin", "comercial"] },
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
      { label: "Hotéis", href: "/admin/hoteis", Icon: IconHotels, roles: ["super_admin", "admin"] },
      { label: "Auditórios", href: "/admin/auditorios", Icon: IconAuditoriums, roles: ["super_admin", "admin"] },
      { label: "Imobiliárias", href: "/admin/imobiliarias", Icon: IconRealEstate, roles: ["super_admin", "admin"] },
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
      { label: "Blog", href: "/admin/blog", Icon: IconBlog, roles: ["super_admin", "admin", "marketing", "conteudo"] },
    ],
  },
  {
    section: "Financeiro",
    items: [{ label: "Financeiro", href: "/admin/financeiro", Icon: IconFinance, roles: ["super_admin", "admin", "financeiro"] }],
  },
  {
    section: "Atendimento",
    items: [
      {
        label: "Suporte",
        href: "/admin/suporte",
        Icon: IconSupport,
        roles: ["super_admin", "admin", "moderador", "financeiro", "comercial", "atendimento"],
      },
    ],
  },
  {
    section: "Configurações",
    items: [
      { label: "Usuários", href: "/admin/usuarios", Icon: IconUsers, roles: ["super_admin"] },
      { label: "LGPD", href: "/admin/lgpd", Icon: IconLgpd, roles: ["super_admin", "admin"] },
    ],
  },
];

function isItemActive(href: string, currentPath: string): boolean {
  if (href === "/admin") return currentPath === "/admin";
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

/** Nav do painel administrativo, mesmo estilo CRM do DashboardNav da empresa
 * (ver dashboard/DashboardNav.tsx): ícone + rótulo, item ativo com
 * preenchimento sólido terracota, agora agrupado nas 8 áreas do prompt
 * mestre da reforma do admin (Visão Geral/Comercial/Operação/Marketing/
 * Financeiro/Resultados/Atendimento/Configurações). Cada item aqui é uma
 * rota própria (não seções #hash de uma mesma página), então o item ativo é
 * só o path atual -- sem precisar de IntersectionObserver. Rotas com
 * sub-página (ex: /admin/suporte/<id>, /admin/publicidade/espacos,
 * /admin/empresas/<id>) continuam acendendo o item pai via startsWith. Cada
 * papel (AdminRole) só vê as seções e itens que pode acessar. */
export function AdminNav({ currentPath, adminRole }: { currentPath: string; adminRole: AdminRole }) {
  const sections = NAV_SECTIONS.map((group) => ({
    section: group.section,
    items: group.items.filter((item) => item.roles.includes(adminRole)),
  })).filter((group) => group.items.length > 0);

  return (
    <nav className="flex flex-col gap-4 overflow-x-auto pb-1 lg:overflow-visible lg:rounded-3xl lg:border lg:border-border lg:bg-white/70 lg:p-3 lg:pb-3">
      {sections.map((group) => (
        <div key={group.section} className="flex shrink-0 flex-col gap-1 lg:shrink">
          <p className="hidden px-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted/70 lg:block">
            {group.section}
          </p>
          <div className="flex gap-1.5 lg:flex-col lg:gap-1">
            {group.items.map(({ label, href, Icon }) => {
              const isActive = isItemActive(href, currentPath);
              return (
                <Link
                  key={label}
                  href={href}
                  className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition-colors ${
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
      ))}
    </nav>
  );
}
