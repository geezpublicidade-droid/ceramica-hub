import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getActivePartners } from "@/lib/services/institutional-partners";

/**
 * Faixa de apoio institucional -- só mostra parceiro com status "ativo"
 * (autorização confirmada pelo admin). Logos monocromáticos e baixo
 * contraste (ver DIAGRAMA SITE.pdf), sem caixa individual ao redor de cada
 * um, texto introdutório à esquerda e link "ver todas" à direita.
 */
export async function InstitutionalPartners() {
  const [t, partners] = await Promise.all([getTranslations("BrandsStrip"), getActivePartners()]);
  if (partners.length === 0) return null;

  return (
    <div className="border-y border-border bg-white">
      <div className="container-page flex min-h-[104px] flex-col flex-wrap items-center justify-center gap-x-10 gap-y-4 py-6 sm:flex-row sm:justify-between sm:py-0">
        <p className="shrink-0 text-[13px] font-medium uppercase tracking-[0.12em] text-muted">{t("intro")}</p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {partners.map((partner) =>
          partner.link ? (
            <a
              key={partner.id}
              href={partner.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[14px] text-muted transition-colors hover:text-foreground"
            >
              {partner.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={partner.logoUrl} alt={partner.name} className="h-8 w-auto grayscale opacity-70" />
              )}
              {!partner.logoUrl && partner.name}
            </a>
          ) : (
            <span key={partner.id} className="flex items-center gap-2 text-[14px] text-muted">
              {partner.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={partner.logoUrl} alt={partner.name} className="h-8 w-auto grayscale opacity-70" />
              )}
              {!partner.logoUrl && partner.name}
            </span>
          ),
          )}
        </div>
        <Link
          href="/parceiros"
          className="shrink-0 text-[13px] font-medium text-primary transition-transform hover:translate-x-1"
        >
          {t("cta")} →
        </Link>
      </div>
    </div>
  );
}
