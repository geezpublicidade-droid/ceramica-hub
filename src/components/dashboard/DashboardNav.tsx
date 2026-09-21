import Link from "next/link";
import { editarHref, dashboardHref } from "@/lib/dashboard-anchors";

const NAV_ITEMS = [
  { label: "Visão geral", href: "/dashboard" },
  { label: "Meu perfil", href: editarHref("perfil") },
  { label: "Fotos e conteúdo", href: editarHref("fotos") },
  { label: "Serviços", href: editarHref("servicos") },
  { label: "Promoções", href: editarHref("promocoes") },
  { label: "Resultados", href: dashboardHref("resultados") },
  { label: "Plano e assinatura", href: dashboardHref("plano") },
  { label: "Configurações", href: dashboardHref("privacidade") },
  { label: "Suporte", href: "/dashboard/suporte" },
] as const;

/** Nav do painel -- item "ativo" compara o pathname (sem rastrear qual #hash
 * está visível, complexidade desnecessária pra esta fase). Dois itens podem
 * ficar ativos ao mesmo tempo quando compartilham pathname (ex: "Visão
 * geral"/"Resultados"/"Plano"/"Configurações" todos em /dashboard) -- é
 * aceitável, todos representam a mesma página. "Suporte" também fica ativo
 * nas páginas de detalhe de um chamado (`/dashboard/suporte/<id>`), por
 * isso o match é por prefixo pras seções que têm sub-rotas, e exato só pra
 * `/dashboard` (raiz compartilhada pelos outros itens). Recebe `currentPath`
 * do server component pai em vez de usePathname, pra não precisar de "use client".
 *
 * Layout responsivo: abas horizontais no mobile (sem espaço pra sidebar),
 * vira menu lateral vertical a partir do breakpoint lg. */
export function DashboardNav({ currentPath }: { currentPath: string }) {
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border pb-px lg:flex-col lg:gap-0.5 lg:overflow-visible lg:border-b-0 lg:border-l lg:pb-0">
      {NAV_ITEMS.map((item) => {
        const [path] = item.href.split("#");
        const isActive = currentPath === path || (path !== "/dashboard" && currentPath.startsWith(`${path}/`));
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-[14px] font-medium transition-colors lg:-ml-px lg:rounded-r-lg lg:border-b-0 lg:border-l-2 lg:px-4 lg:py-2.5 ${
              isActive
                ? "border-primary text-primary lg:bg-primary/5"
                : "border-transparent text-muted hover:text-foreground lg:hover:bg-black/[0.03]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
