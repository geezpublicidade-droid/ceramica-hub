import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export async function CinematicFooter() {
  const t = await getTranslations("CinematicFooter");
  const linkGroups: { label: string; href: string }[] = [
    { label: t("links.negocios"), href: "/preview#empresas" },
    { label: t("links.eventos"), href: "/forum-de-negocios" },
    { label: t("links.complexo"), href: "/torres/torre-park" },
    { label: t("links.ancoras"), href: "/parceiros" },
    { label: t("links.categorias"), href: "/preview#empresas" },
    { label: t("links.oportunidades"), href: "/preview#oportunidades" },
    { label: t("links.ofertas"), href: "/preview#beneficios" },
    { label: t("links.blog"), href: "/blog" },
    { label: t("links.noticias"), href: "/noticias" },
    { label: t("links.businessTravel"), href: "/business-travel" },
    { label: t("links.auditorios"), href: "/auditorios-reunioes" },
    { label: t("links.imobiliarias"), href: "/imobiliarias" },
    { label: t("links.forumNegocios"), href: "/forum-de-negocios" },
    { label: t("links.impacto"), href: "/impacto" },
    { label: t("links.sejaUmParceiro"), href: "/seja-um-parceiro" },
    { label: t("links.cadastrarEmpresa"), href: "/cadastro" },
    { label: t("links.contato"), href: "/contato" },
    { label: t("links.termos"), href: "/termos" },
    { label: t("links.privacidade"), href: "/privacidade" },
    { label: t("links.politicaCadastro"), href: "/politica-de-cadastro" },
    { label: t("links.politicaCancelamento"), href: "/politica-de-cancelamento" },
    { label: t("links.solicitarRemocao"), href: "/contato" },
  ];

  return (
    <footer className="border-t border-border bg-surface text-foreground">
      <div className="container-page py-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[16px] font-semibold tracking-tight">
              <img src="/images/logo-ceramica-hub.png" alt="" className="h-6 w-6" />
              Cerâmica <span className="text-primary">Hub</span>
            </p>
            <p className="mt-1 max-w-sm text-[13px] leading-snug text-muted">{t("tagline")}</p>
          </div>

          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-muted sm:max-w-xl sm:justify-end">
            {linkGroups.map((link) => (
              <Link key={link.label} href={link.href} className="transition-colors hover:text-foreground">
                {link.label}
              </Link>
            ))}
            <LanguageSwitcher />
          </nav>
        </div>

        <div className="mt-5 border-t border-border pt-3.5">
          <p className="max-w-3xl text-[11px] leading-snug text-muted">{t("disclaimer")}</p>
          <div className="mt-2.5 flex flex-col gap-1.5 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
            <a
              href="https://www.geezmarketing.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              {t("projectBy")}
            </a>
            <p>{t("copyright", { year: new Date().getFullYear() })}</p>
            <p>{t("location")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
