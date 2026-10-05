"use client";

import { useEffect, useRef } from "react";
import { BadgeCheck, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Business } from "@/data/businesses";
import { BusinessAvatar } from "@/components/BusinessAvatar";
import { FavoriteButton } from "@/components/FavoriteButton";
import { TrackedLink } from "@/components/TrackedLink";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { logPlacementClick, logPlacementImpression, logWhatsAppClick } from "@/lib/actions/log-search";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { track } from "@/lib/analytics";

export type BusinessCardLabels = {
  verified: string;
  viewProfile: string;
  whatsapp: string;
  /** já formatado, ex.: "4,8 · 12 avaliações" */
  rating?: string;
};

export type BusinessCardProps = {
  business: Business;
  /** categoria mais específica da empresa (ou subcategoria) */
  categoryLabel: string;
  labels: BusinessCardLabels;
  /** presente = posição comercial paga: registra impressão e cliques atribuídos a ela */
  placement?: { id: string; badge: string };
  layout?: "grid" | "list";
};

/** Capa sem foto autorizada: textura discreta na cor institucional, sem bloco vazio. */
const FALLBACK_COVER = {
  backgroundColor: "color-mix(in srgb, var(--primary) 8%, var(--surface))",
  backgroundImage:
    "radial-gradient(circle at 18% 22%, color-mix(in srgb, var(--primary) 22%, transparent), transparent 55%), repeating-linear-gradient(45deg, color-mix(in srgb, var(--primary) 7%, transparent) 0 1px, transparent 1px 14px)",
};

const WHATSAPP_CLASS =
  "neu-primary inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-4 text-[15px] font-medium text-white";
const PROFILE_CLASS =
  "neu inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-4 text-[15px] font-medium text-foreground";

/**
 * Card de empresa da vitrine: capa 16:9, logo sobreposto, selos, descrição limitada e
 * botões sempre alinhados no rodapé (altura igual em toda a linha do grid).
 * Com `placement`, é um resultado comercial ("Destaque"), identificado como tal.
 */
export function BusinessCard({ business, categoryLabel, labels, placement, layout = "grid" }: BusinessCardProps) {
  const ref = useRef<HTMLElement>(null);
  const isList = layout === "list";
  const cover = business.imageUsageAuthorized ? business.coverPhoto : undefined;
  const profileHref = placement ? `/empresa/${business.slug}?pl=${placement.id}` : `/empresa/${business.slug}`;
  const placementId = placement?.id;

  useEffect(() => {
    const element = ref.current;
    if (!element || !placementId) return;
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

  const whatsappHref = buildWhatsAppLink(business.phone, business.name);

  return (
    <article
      ref={ref}
      className={`group flex h-full overflow-hidden rounded-2xl border border-border bg-white transition-shadow hover:shadow-[0_12px_28px_-18px_rgba(0,0,0,0.25)] ${
        isList ? "flex-col sm:flex-row" : "flex-col"
      } ${placement ? "border-primary/25" : ""}`}
    >
      <div
        className={`relative aspect-video w-full shrink-0 overflow-hidden ${isList ? "sm:aspect-auto sm:w-64 lg:w-72" : ""}`}
        style={cover ? undefined : FALLBACK_COVER}
      >
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        {placement && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-medium text-primary">
            <Star aria-hidden="true" className="h-3 w-3 fill-primary" strokeWidth={0} />
            {placement.badge}
          </span>
        )}
        <div className="absolute right-3 top-3">
          <FavoriteButton businessId={business.id} overlay />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col px-5 pb-5">
        <div className={`relative flex items-start gap-3 ${isList ? "sm:mt-5" : ""}`}>
          <Link href={profileHref} aria-label={business.name} className={`shrink-0 ${isList ? "" : "-mt-8"}`}>
            <BusinessAvatar
              business={business}
              className={`h-16 w-16 rounded-full border-4 border-white bg-white shadow-sm ${isList ? "sm:h-14 sm:w-14 sm:border-0 sm:shadow-none" : ""}`}
              textClassName="text-[18px] font-semibold text-foreground"
            />
          </Link>
          <div className="min-w-0 flex-1 pt-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <h3 className="min-w-0 line-clamp-2 text-[17px] font-semibold leading-snug tracking-tight">
                <Link href={profileHref} className="hover:text-primary">
                  {business.name}
                </Link>
              </h3>
              {business.verified && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[12px] font-medium text-primary">
                  <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
                  {labels.verified}
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="mt-2 truncate text-[14px] text-muted">
          <span className="font-medium text-primary/90">{categoryLabel}</span>
          {business.floor && <> · {business.floor}</>}
        </p>
        <p className="mt-2 line-clamp-3 min-h-[4.5em] text-[15px] leading-[1.5] text-muted">{business.description}</p>
        {labels.rating && <p className="mt-2 text-[13px] text-muted">★ {labels.rating}</p>}

        <div className="mt-auto flex items-center gap-3 pt-4">
          {placementId ? (
            <Link
              href={profileHref}
              onClick={() => void logPlacementClick(placementId, business.id, "profile").catch(() => undefined)}
              className={PROFILE_CLASS}
            >
              {labels.viewProfile}
            </Link>
          ) : (
            <Link href={profileHref} className={PROFILE_CLASS}>
              {labels.viewProfile}
            </Link>
          )}
          {placementId ? (
            <TrackedLink
              href={whatsappHref}
              onTrack={() => {
                track({ name: "contact", method: "whatsapp", businessName: business.name });
                void logWhatsAppClick(business.id).catch(() => undefined);
                void logPlacementClick(placementId, business.id, "whatsapp").catch(() => undefined);
              }}
              className={WHATSAPP_CLASS}
            >
              {labels.whatsapp}
            </TrackedLink>
          ) : (
            <WhatsAppLink href={whatsappHref} businessId={business.id} businessName={business.name} className={WHATSAPP_CLASS}>
              {labels.whatsapp}
            </WhatsAppLink>
          )}
        </div>
      </div>
    </article>
  );
}
