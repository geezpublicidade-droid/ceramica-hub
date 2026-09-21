"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
 * preenchimento sólido terracota. Só UM item fica ativo por vez -- quando
 * várias seções da mesma página têm âncora própria (ex: "Resultados"/
 * "Plano"/"Configurações" são todas #hash de /dashboard), um
 * IntersectionObserver acompanha qual seção está realmente visível na tela
 * e só essa acende; sem seção nenhuma visível ainda (topo da página), o
 * item sem #hash daquele path (ex: "Visão geral") fica ativo como padrão.
 * Path que não bate com `currentPath` nunca ativa, independente de scroll.
 * Recebe `currentPath` do server component pai em vez de usePathname, pra
 * cada página só precisar passar sua própria rota (nunca lê a URL real do
 * navegador -- por isso não precisa tratar sub-rotas como /suporte/<id>,
 * cada página já passa o valor certo).
 *
 * Layout responsivo: linha de pills horizontal com scroll no mobile (sem
 * espaço pra sidebar), vira coluna dentro de um cartão a partir do
 * breakpoint lg -- visual de app/CRM em vez de uma lista solta. */
export function DashboardNav({ currentPath }: { currentPath: string }) {
  const [activeHash, setActiveHash] = useState<string | null>(null);

  useEffect(() => {
    const ids = NAV_ITEMS.map((item) => item.href.split("#")).filter(([path, hash]) => path === currentPath && hash);
    const elements = ids
      .map(([, hash]) => document.getElementById(hash!))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    // Última seção da página às vezes não tem espaço de rolagem suficiente
    // pra cruzar a faixa de gatilho do IntersectionObserver (ela nunca
    // chega perto do topo da viewport porque a página acaba antes) -- ao
    // chegar no fim real da página, força a última seção rastreada como
    // ativa. Checado nos dois lugares (não só no listener de scroll) porque
    // o callback do IntersectionObserver é assíncrono/batched pelo
    // navegador e pode chegar depois do scroll, sobrescrevendo o estado.
    const lastId = elements[elements.length - 1].id;
    function isAtBottom() {
      return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    }
    function activateLastIfAtBottom() {
      if (isAtBottom()) setActiveHash(lastId);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (isAtBottom()) {
          setActiveHash(lastId);
          return;
        }
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        const topmost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
        setActiveHash(topmost.target.id);
      },
      { rootMargin: "-100px 0px -70% 0px", threshold: 0 }
    );
    elements.forEach((el) => observer.observe(el));

    window.addEventListener("scroll", activateLastIfAtBottom, { passive: true });
    activateLastIfAtBottom();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", activateLastIfAtBottom);
    };
  }, [currentPath]);

  return (
    <nav className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-3xl lg:border lg:border-border lg:bg-white/70 lg:p-3 lg:pb-3">
      {NAV_ITEMS.map(({ label, href, Icon }) => {
        const [path, hash] = href.split("#");
        const isActive = path === currentPath && (hash ? activeHash === hash : activeHash === null);
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
