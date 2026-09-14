"use client";

import type { ReactNode } from "react";
import { TrackedLink } from "@/components/TrackedLink";
import { logWhatsAppClick } from "@/lib/actions/log-search";

type WhatsAppLinkProps = {
  href: string;
  businessId: string;
  className?: string;
  children: ReactNode;
};

export function WhatsAppLink({ href, businessId, className, children }: WhatsAppLinkProps) {
  return (
    <TrackedLink href={href} className={className} onTrack={() => void logWhatsAppClick(businessId)}>
      {children}
    </TrackedLink>
  );
}
