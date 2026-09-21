import Link from "next/link";
import { editarHref, dashboardHref } from "@/lib/dashboard-anchors";
import {
  IconOverview,
  IconProfile,
  IconPhotos,
  IconServices,
  IconPromotions,
  IconResults,
  IconPlan,
  IconSettings,
  IconSupport,
} from "@/components/dashboard/nav-icons";

const NAV_ITEMS = [
  { label: "Visão geral", href: "/dashboard", Icon: IconOverview },
  { label: "Meu perfil", href: editarHref("perfil"), Icon: IconProfile },
  { label: "Fotos e conteúdo", href: editarHref("fotos"), Icon: IconPhotos },
  { label: "Serviços", href: editarHref("servicos"), Icon: IconServices },
  { label: "Promoções", href: editarHref("promocoes"), Icon: IconPromotions },
  { label: "Resultados", href: dashboardHref("resultados"), Icon: IconResults },
  { label: "Plano e assinatura", href: dashboardHref("plano"), Icon: IconPlan },
  { label: "Configurações", href: dashboardHref("privacidade"), Icon: IconSettings },
  { label: "Suporte", href: "/dashboard/suporte", Icon: IconSupport },
] as const;

/** Nav do painel, estilo sidebar de CRM: ícone + rótulo, item ativo com
 * preenchimento sólido terracota (não só um traço de destaque). "Ativo"
 * compara o pathname (sem rastrear qual #hash está visível, complexidade
 * desnecessária pra esta fase). Dois itens podem ficar ativos ao mesmo
 * tempo quando compartilham pathname (ex: "Visão geral"/"Resultados"/
 * "Plano"/"Configurações" todos em /dashboard) -- é aceitável, todos
 * representam a mesma página. "Suporte" também fica ativo nas páginas de
 * detalhe de um chamado (`/dashboard/suporte/<id>`), por isso o match é por
 * prefixo pras seções que têm sub-rotas, e exato só pra `/dashboard` (raiz
 * compartilhada pelos outros itens). Recebe `currentPath` do server
 * component pai em vez de usePathname, pra não precisar de "use client".
 *
 * Layout responsivo: linha de pills horizontal com scroll no mobile (sem
 * espaço pra sidebar), vira coluna dentro de um cartão a partir do
 * breakpoint lg -- visual de app/CRM em vez de uma lista solta. */
export function DashboardNav({ currentPath }: { currentPath: string }) {
  return (
    <nav className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-3xl lg:border lg:border-border lg:bg-white/70 lg:p-3 lg:pb-3">
      {NAV_ITEMS.map(({ label, href, Icon }) => {
        const [path] = href.split("#");
        const isActive = currentPath === path || (path !== "/dashboard" && currentPath.startsWith(`${path}/`));
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
