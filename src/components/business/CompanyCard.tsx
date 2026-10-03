import { Link } from "@/i18n/navigation";
import type { Business } from "@/data/businesses";
import { BusinessAvatar } from "@/components/BusinessAvatar";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export type CompanyCardLabels = {
  verified: string;
  whatsapp: string;
  viewProfile: string;
  /** já formatado, ex.: "4,8 · 12 avaliações" */
  rating?: string;
};

type CompanyCardProps = {
  business: Business;
  categoryLabel: string;
  layout: "grid" | "list";
  labels: CompanyCardLabels;
};

/** Card padrão (listagem orgânica): altura consistente, texto limitado por line-clamp. */
export function CompanyCard({ business, categoryLabel, layout, labels }: CompanyCardProps) {
  const profileHref = `/empresa/${business.slug}`;
  const isList = layout === "list";

  return (
    <article
      className={`glass-card-light flex rounded-3xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-18px_rgba(0,0,0,0.18)] ${
        isList ? "flex-col gap-4 sm:flex-row sm:items-center" : "h-full flex-col gap-4"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <Link href={profileHref} className="shrink-0">
          <BusinessAvatar
            business={business}
            className="h-16 w-16 rounded-full bg-white"
            textClassName="text-[18px] font-semibold text-foreground"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link href={profileHref} className="min-w-0">
              <h3 className="line-clamp-2 text-[18px] font-semibold leading-snug tracking-tight hover:text-primary">
                {business.name}
              </h3>
            </Link>
            {business.verified && (
              <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[12px] font-medium text-primary">
                {labels.verified}
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-[14px] font-medium text-primary/90">{categoryLabel}</p>
          <p className="mt-0.5 truncate text-[14px] text-muted">{business.floor}</p>
          <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-muted">{business.description}</p>
          {labels.rating && <p className="mt-2 text-[13px] text-muted">★ {labels.rating}</p>}
        </div>
      </div>

      <div className={`flex items-center gap-3 ${isList ? "sm:shrink-0" : "mt-auto"}`}>
        <Link
          href={profileHref}
          className="neu inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-5 text-[15px] font-medium text-foreground sm:flex-none"
        >
          {labels.viewProfile}
        </Link>
        <WhatsAppLink
          href={buildWhatsAppLink(business.phone, business.name)}
          businessId={business.id}
          className="neu-primary inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-5 text-[15px] font-medium text-white sm:flex-none"
        >
          {labels.whatsapp}
        </WhatsAppLink>
      </div>
    </article>
  );
}
