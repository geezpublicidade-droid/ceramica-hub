"use client";

import type { ReactNode } from "react";
import { TrackedLink } from "@/components/TrackedLink";
import { logLandingEvent, logWhatsAppClick, type LandingEvent } from "@/lib/actions/log-search";
import { recallPlacement } from "@/lib/placement-attribution";
import { track } from "@/lib/analytics";

type TrackedInterestLinkProps = {
  href: string;
  businessId: string;
  /** serviço ou oferta clicada */
  itemId: string;
  event: Extract<LandingEvent, "service_clicked" | "offer_clicked">;
  /** cupom copiado para a área de transferência no clique (oferta) */
  couponCode?: string | null;
  className?: string;
  children: ReactNode;
};

/** Abre o WhatsApp com a mensagem do serviço/oferta e registra o clique do item e o contato. */
export function TrackedInterestLink({ href, businessId, itemId, event, couponCode, className, children }: TrackedInterestLinkProps) {
  return (
    <TrackedLink
      href={href}
      className={className}
      onTrack={() => {
        track({ name: "contact", method: "whatsapp" });
        void logLandingEvent(businessId, event, itemId);
        void logWhatsAppClick(businessId, recallPlacement(businessId));
        if (couponCode) void navigator.clipboard?.writeText(couponCode).catch(() => undefined);
      }}
    >
      {children}
    </TrackedLink>
  );
}
