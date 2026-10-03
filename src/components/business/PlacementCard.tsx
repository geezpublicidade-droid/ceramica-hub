"use client";

import { useEffect, useRef } from "react";
import { Link } from "@/i18n/navigation";
import type { Business } from "@/data/businesses";
import { BusinessAvatar } from "@/components/BusinessAvatar";
import { TrackedLink } from "@/components/TrackedLink";
import { logPlacementClick, logPlacementImpression, logWhatsAppClick } from "@/lib/actions/log-search";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export type PlacementCardLabels = {
  badge: string;
  verified: string;
  viewProfile: string;
  whatsapp: string;
  offer: string;
};

type PlacementCardProps = {
  variant: "leader" | "premium" | "featured";
  placementId: string;
  business: Business;
  categoryLabel: string;
  specialties: string[];
  offerText: string | null;
  labels: PlacementCardLabels;
};

const VARIANT = {
  leader: { description: "line-clamp-3", avatar: "h-20 w-20", cover: "h-44 sm:h-56", title: "text-[24px]" },
  premium: { description: "line-clamp-3", avatar: "h-16 w-16", cover: "h-32", title: "text-[20px]" },
  featured: { description: "line-clamp-2", avatar: "h-14 w-14", cover: "", title: "text-[18px]" },
} as const;

/**
 * Card de posição comercial paga (Líder / Premium / Destaque). Sempre leva o selo do
 * tipo, registra 1 impressão quando entra na tela e os cliques (perfil e WhatsApp)
 * atribuídos à posição. Capa só aparece com uso de imagem autorizado pela empresa.
 */
export function PlacementCard({
  variant,
  placementId,
  business,
  categoryLabel,
  specialties,
  offerText,
  labels,
}: PlacementCardProps) {
  const ref = useRef<HTMLElement>(null);
  const style = VARIANT[variant];
  const profileHref = `/empresa/${business.slug}?pl=${placementId}`;
  const cover = business.imageUsageAuthorized ? business.coverPhoto : undefined;
  // sem capa autorizada o bloco some: nada de retângulo vazio ocupando espaço
  const showCover = variant !== "featured" && Boolean(cover);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        void logPlacementImpression(placementId, business.id).catch(() => undefined);
      },
      { threshold: 0.5 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [placementId, business.id]);

  return (
    <article
      ref={ref}
      className={`glass-card-light flex h-full overflow-hidden rounded-3xl ${
        variant === "leader" ? "flex-col border-primary/30 lg:flex-row" : "flex-col"
      }`}
    >
      {showCover && (
        <div
          className={`relative w-full shrink-0 bg-primary/10 bg-cover bg-center ${style.cover} ${
            variant === "leader" ? "lg:h-auto lg:w-2/5" : ""
          }`}
          style={cover ? { backgroundImage: `url("${cover}")` } : undefined}
          aria-hidden="true"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <BusinessAvatar
            business={business}
            className={`${style.avatar} rounded-full border border-border bg-white ${showCover ? "-mt-12 shadow-sm lg:mt-0" : ""}`}
            textClassName="text-[18px] font-semibold text-foreground"
          />
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[12px] font-medium text-primary">
                {labels.badge}
              </span>
              {business.verified && <span className="text-[12px] text-muted">{labels.verified}</span>}
            </div>
            <h3 className={`mt-1.5 line-clamp-2 font-semibold leading-snug tracking-tight ${style.title}`}>
              {business.name}
            </h3>
            <p className="mt-0.5 truncate text-[14px] text-muted">
              {categoryLabel} · {business.floor}
            </p>
          </div>
        </div>

        <p className={`${style.description} text-[15px] leading-relaxed text-muted`}>{business.description}</p>

        {specialties.length > 0 && variant !== "featured" && (
          <ul className="flex flex-wrap gap-1.5">
            {specialties.slice(0, variant === "leader" ? 6 : 3).map((specialty) => (
              <li key={specialty} className="rounded-full border border-border px-2.5 py-1 text-[12px] text-muted">
                {specialty}
              </li>
            ))}
          </ul>
        )}

        {offerText && variant === "leader" && (
          <p className="rounded-2xl bg-primary/5 px-4 py-3 text-[14px] text-foreground">
            <span className="font-medium text-primary">{labels.offer}:</span> {offerText}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
          <Link
            href={profileHref}
            onClick={() => void logPlacementClick(placementId, business.id, "profile").catch(() => undefined)}
            className="neu inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-5 text-[15px] font-medium text-foreground sm:flex-none"
          >
            {labels.viewProfile}
          </Link>
          <TrackedLink
            href={buildWhatsAppLink(business.phone, business.name)}
            onTrack={() => {
              void logWhatsAppClick(business.id).catch(() => undefined);
              void logPlacementClick(placementId, business.id, "whatsapp").catch(() => undefined);
            }}
            className="neu-primary inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-5 text-[15px] font-medium text-white sm:flex-none"
          >
            {labels.whatsapp}
          </TrackedLink>
        </div>
      </div>
    </article>
  );
}
