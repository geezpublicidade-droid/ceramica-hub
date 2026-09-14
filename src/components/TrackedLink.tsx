"use client";

import type { ReactNode } from "react";

type TrackedLinkProps = {
  href: string;
  onTrack: () => void;
  className?: string;
  rel?: string;
  children: ReactNode;
};

/** Link externo que loga uma métrica no clique — base de WhatsAppLink, AdLink e EventInterestLink. */
export function TrackedLink({ href, onTrack, className, rel = "noopener noreferrer", children }: TrackedLinkProps) {
  return (
    <a href={href} target="_blank" rel={rel} className={className} onClick={onTrack}>
      {children}
    </a>
  );
}
