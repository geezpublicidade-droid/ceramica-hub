import { Link } from "@/i18n/navigation";
import type { Business } from "@/data/businesses";
import { BusinessAvatar } from "@/components/BusinessAvatar";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type BusinessCardGridProps = {
  businesses: Business[];
  emptyTitle: string;
  emptyDescription: string;
  ctaRegisterFree: string;
  ctaBackLabel: string;
  ctaBackHref: string;
  verifiedLabel: string;
  whatsappLabel: string;
};

/** Grade de cards reutilizada pelas páginas de categoria e de torre — ambas
 * listam empresas reais aprovadas, sem filtro/busca (isso fica no Directory
 * da home). Recebe os textos já traduzidos pra não acoplar a um namespace fixo. */
export function BusinessCardGrid({
  businesses,
  emptyTitle,
  emptyDescription,
  ctaRegisterFree,
  ctaBackLabel,
  ctaBackHref,
  verifiedLabel,
  whatsappLabel,
}: BusinessCardGridProps) {
  if (businesses.length === 0) {
    return (
      <div className="mt-14 rounded-3xl border border-border bg-white/60 px-6 py-16 text-center">
        <h2 className="text-[clamp(1.4rem,3vw,1.9rem)] font-semibold tracking-tight text-foreground">
          {emptyTitle}
        </h2>
        <p className="mt-4 text-[17px] leading-relaxed text-muted">{emptyDescription}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/cadastro" className="neu-primary rounded-full px-7 py-3.5 text-[17px] font-medium text-white">
            {ctaRegisterFree}
          </Link>
          <Link href={ctaBackHref} className="neu rounded-full px-7 py-3.5 text-[17px] font-medium text-foreground">
            {ctaBackLabel}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {businesses.map((business) => (
        <div
          key={business.id}
          className="glass-card-light group flex gap-5 rounded-3xl p-7 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)]"
        >
          <Link href={`/empresa/${business.slug}`} className="shrink-0">
            <BusinessAvatar
              business={business}
              className="h-20 w-20 rounded-2xl bg-white"
              textClassName="text-[20px] font-semibold text-foreground"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <Link href={`/empresa/${business.slug}`} className="min-w-0">
                <h2 className="text-[20px] font-semibold leading-snug tracking-tight hover:text-primary">
                  {business.name}
                </h2>
              </Link>
              {business.verified && (
                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[13px] font-medium text-primary">
                  {verifiedLabel}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[16px] text-muted">{business.floor}</p>
            <p className="mt-3 text-[17px] leading-relaxed text-muted">{business.description}</p>
            <WhatsAppLink
              href={buildWhatsAppLink(business.phone, business.name)}
              businessId={business.id}
              className="mt-4 inline-flex items-center gap-1.5 text-[16px] font-medium text-primary transition-transform hover:translate-x-1"
            >
              {whatsappLabel}
              <span aria-hidden="true">→</span>
            </WhatsAppLink>
          </div>
        </div>
      ))}
    </div>
  );
}
