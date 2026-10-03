"use client";

import type { ReactNode } from "react";
import { TrackedLink } from "@/components/TrackedLink";
import { logWhatsAppClick } from "@/lib/actions/log-search";
import { recallPlacement } from "@/lib/placement-attribution";
import { track } from "@/lib/analytics";

type WhatsAppLinkProps = {
  href: string;
  businessId: string;
  businessName?: string;
  className?: string;
  children: ReactNode;
};

export function WhatsAppLink({ href, businessId, businessName, className, children }: WhatsAppLinkProps) {
  return (
    <TrackedLink href={href} className={className} onTrack={() => {
        track({ name: "contact", method: "whatsapp", businessName });
        void logWhatsAppClick(businessId, recallPlacement(businessId));
      }}>
      {children}
    </TrackedLink>
  );
}
