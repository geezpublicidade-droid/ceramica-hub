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
} from "@/components/admin/admin-nav-icons";

const NAV_ITEMS = [
  { label: "Visão geral", href: "/admin", Icon: IconOverview, roles: ["super_admin", "admin", "moderador", "analista"] },
  { label: "Financeiro", href: "/admin/financeiro", Icon: IconFinance, roles: ["super_admin", "admin", "financeiro"] },
  {
    label: "Publicidade",
    href: "/admin/publicidade",
    Icon: IconAds,
    roles: ["super_admin", "admin", "comercial", "marketing"],
  },
  { label: "Leads", href: "/admin/leads", Icon: IconLeads, roles: ["super_admin", "admin", "comercial"] },
  {
    label: "Avaliações",
    href: "/admin/avaliacoes",
    Icon: IconReviews,
    roles: ["super_admin", "admin", "moderador", "conteudo"],
  },
  { label: "LGPD", href: "/admin/lgpd", Icon: IconLgpd, roles: ["super_admin", "admin"] },
  { label: "Blog", href: "/admin/blog", Icon: IconBlog, roles: ["super_admin", "admin", "marketing", "conteudo"] },
  { label: "Parceiros", href: "/admin/parceiros", Icon: IconPartners, roles: ["super_admin", "admin", "comercial"] },
  { label: "Hotéis", href: "/admin/hoteis", Icon: IconHotels, roles: ["super_admin", "admin"] },
  { label: "Auditórios", href: "/admin/auditorios", Icon: IconAuditoriums, roles: ["super_admin", "admin"] },
  { label: "Imobiliárias", href: "/admin/imobiliarias", Icon: IconRealEstate, roles: ["super_admin", "admin"] },
  {
    label: "Eventos",
    href: "/admin/eventos",
    Icon: IconEvents,
    roles: ["super_admin", "admin", "marketing", "conteudo"],
  },
  { label: "Usuários", href: "/admin/usuarios", Icon: IconUsers, roles: ["super_admin"] },
  {
    label: "Suporte",
    href: "/admin/suporte",
    Icon: IconSupport,
    roles: ["super_admin", "admin", "moderador", "financeiro", "comercial", "atendimento"],
  },
] as const satisfies { label: string; href: string; Icon: typeof IconOverview; roles: AdminRole[] }[];

function isItemActive(href: string, currentPath: string): boolean {
  if (href === "/admin") return currentPath === "/admin";
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

/** Nav do painel administrativo, mesmo estilo CRM do DashboardNav da empresa
 * (ver dashboard/DashboardNav.tsx): ícone + rótulo, item ativo com
 * preenchimento sólido terracota. Cada item aqui é uma rota própria (não
 * seções #hash de uma mesma página), então o item ativo é só o path atual
 * -- sem precisar de IntersectionObserver. Rotas com sub-página (ex:
 * /admin/suporte/<id>, /admin/publicidade/espacos) continuam acendendo o
 * item pai via startsWith. Cada papel (AdminRole) só vê as seções que pode
 * acessar -- mesmas regras que já existiam nos links condicionais da home
 * do admin, agora centralizadas aqui em vez de espalhadas por cada página. */
export function AdminNav({ currentPath, adminRole }: { currentPath: string; adminRole: AdminRole }) {
  const items = NAV_ITEMS.filter((item) => (item.roles as readonly AdminRole[]).includes(adminRole));

  return (
    <nav className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-3xl lg:border lg:border-border lg:bg-white/70 lg:p-3 lg:pb-3">
      {items.map(({ label, href, Icon }) => {
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
    </nav>
  );
}
