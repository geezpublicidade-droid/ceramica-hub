import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FadeUp } from "@/components/motion/FadeUp";
import { getActivePartners, type InstitutionalPartner } from "@/lib/services/institutional-partners";
import { HOME_TIERS } from "@/lib/partner-tiers";

const MAX_LOGOS = 10;
/** Quantos logos cabem em uma "metade" da faixa, pra rolagem contínua nunca mostrar buraco. */
const MIN_ITEMS_PER_HALF = 8;

const logoClass = "h-10 w-auto grayscale opacity-70 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0";

/** Logo da âncora: leva à página própria quando existe; senão ao site do parceiro; senão fica sem link. */
function PartnerLogo({ partner, decorative }: { partner: InstitutionalPartner; decorative: boolean }) {
  const content = partner.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={partner.logoUrl} alt={decorative ? "" : partner.name} className={logoClass} />
  ) : (
    <span className="text-[15px] font-medium text-muted group-hover:text-foreground">{partner.name}</span>
  );
  const className = "group mx-6 flex shrink-0 items-center sm:mx-8";
  const tabIndex = decorative ? -1 : undefined;

  if (partner.pageSlug) {
    return (
      <Link href={`/parceiros/${partner.pageSlug}`} className={className} tabIndex={tabIndex} aria-label={decorative ? undefined : partner.name}>
        {content}
      </Link>
    );
  }
  if (partner.link) {
    return (
      <a href={partner.link} target="_blank" rel="noopener noreferrer" className={className} tabIndex={tabIndex}>
        {content}
      </a>
    );
  }
  return <span className={className}>{content}</span>;
}

/**
 * Faixa de apoio institucional -- só mostra parceiro com status "ativo"
 * (autorização confirmada pelo admin). Os logos rolam sem parar (pausa no
 * hover/foco, parada com reduced-motion) e cada um leva à página da Âncora.
 * Limitada a ~10 marcas pra não diluir o status de quem está nela.
 */
export async function InstitutionalPartners() {
  const [t, allPartners] = await Promise.all([getTranslations("BrandsStrip"), getActivePartners()]);
  // Parceiro do Ecossistema não entra na faixa da home (ver HOME_TIERS).
  const partners = allPartners.filter((partner) => HOME_TIERS.includes(partner.tier)).slice(0, MAX_LOGOS);
  if (partners.length === 0) return null;

  const repeats = Math.ceil(MIN_ITEMS_PER_HALF / partners.length);
  const half = Array.from({ length: repeats }, () => partners).flat();

  return (
    <div className="border-y border-border bg-white">
      <FadeUp className="container-page flex min-h-[104px] flex-col items-center justify-center gap-x-10 gap-y-3 py-6 lg:flex-row lg:py-0">
        <p className="shrink-0 text-[13px] font-medium uppercase tracking-[0.12em] text-muted">{t("intro")}</p>
        <div
          className="logo-marquee min-w-0 flex-1 overflow-hidden self-stretch [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]"
          aria-label={t("intro")}
        >
          <div className="logo-marquee-track py-3">
            {half.map((partner, index) => (
              <PartnerLogo key={`a-${partner.id}-${index}`} partner={partner} decorative={index >= partners.length} />
            ))}
            <div className="logo-marquee-dup flex" aria-hidden="true">
              {half.map((partner, index) => (
                <PartnerLogo key={`b-${partner.id}-${index}`} partner={partner} decorative />
              ))}
            </div>
          </div>
        </div>
        <Link href="/parceiros" className="shrink-0 text-[13px] font-medium text-primary transition-transform hover:translate-x-1">
          {t("cta")} →
        </Link>
      </FadeUp>
    </div>
  );
}
