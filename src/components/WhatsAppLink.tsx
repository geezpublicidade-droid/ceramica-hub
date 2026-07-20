"use client";

import type { ReactNode } from "react";
import { logWhatsAppClick } from "@/lib/actions/log-search";

type WhatsAppLinkProps = {
  href: string;
  businessId: string;
  className?: string;
  children: ReactNode;
};

export function WhatsAppLink({ href, businessId, className, children }: WhatsAppLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => {
        void logWhatsAppClick(businessId);
      }}
    >
      {children}
    </a>
  );
}
