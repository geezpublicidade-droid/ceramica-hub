"use client";

import { useTranslations } from "next-intl";
import type { Business } from "@/data/businesses";

const STYLE: Record<NonNullable<Business["listing"]["badge"]>, string> = {
  premium: "bg-foreground/90 text-white",
  featured: "bg-primary/10 text-primary",
  sponsored: "bg-black/[0.06] text-foreground/70",
};

/** Selo discreto e transparente de conteúdo de plano pago: “Premium”, “Em destaque” ou “Patrocinada”. Gratuito não mostra nada. */
export function ListingBadge({ badge }: { badge: Business["listing"]["badge"] }) {
  const t = useTranslations("LandingEmpresa");
  if (!badge) return null;
  const label = badge === "premium" ? t("badgePremium") : badge === "featured" ? t("badgeFeatured") : t("badgeSponsored");
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-medium tracking-wide ${STYLE[badge]}`}>{label}</span>;
}
