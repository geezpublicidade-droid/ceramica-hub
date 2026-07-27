import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export async function CinematicFooter() {
  const t = await getTranslations("CinematicFooter");
  const linkGroups: { label: string; href: string }[] = [
    { label: t("links.empresas"), href: "/#empresas" },
    { label: t("links.categorias"), href: "/#empresas" },
    { label: t("links.oportunidades"), href: "/#oportunidades" },
    { label: t("links.ofertas"), href: "/#beneficios" },
    { label: t("links.blog"), href: "/blog" },
    { label: t("links.noticias"), href: "/noticias" },
    { label: t("links.businessTravel"), href: "/business-travel" },
    { label: t("links.auditorios"), href: "/auditorios-reunioes" },
    { label: t("links.imobiliarias"), href: "/imobiliarias" },
    { label: t("links.cadastrarEmpresa"), href: "/cadastro" },
    { label: t("links.contato"), href: "/contato" },
    { label: t("links.termos"), href: "/termos" },
    { label: t("links.privacidade"), href: "/privacidade" },
    { label: t("links.politicaCadastro"), href: "/politica-de-cadastro" },
    { label: t("links.politicaCancelamento"), href: "/politica-de-cancelamento" },
    { label: t("links.solicitarRemocao"), href: "/contato" },
  ];

  return (
    <footer className="border-t border-border bg-surface px-6 py-16 text-foreground">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[19px] font-semibold tracking-tight">
              Cerâmica <span className="text-primary">Hub</span>
            </p>
            <p className="mt-3 max-w-sm text-[16px] leading-relaxed text-muted">{t("tagline")}</p>
          </div>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[15px] text-muted">
            {linkGroups.map((link) => (
              <Link key={link.label} href={link.href} className="transition-colors hover:text-foreground">
                {link.label}
              </Link>
            ))}
            <LanguageSwitcher />
          </nav>
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <p className="max-w-3xl text-[14px] leading-relaxed text-muted">{t("disclaimer")}</p>
          <div className="mt-4 flex flex-col gap-2 text-[14px] text-muted sm:flex-row sm:items-center sm:justify-between">
            <a
              href="https://www.geezmarketing.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              {t("projectBy")}
            </a>
            <p>{t("copyright", { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
