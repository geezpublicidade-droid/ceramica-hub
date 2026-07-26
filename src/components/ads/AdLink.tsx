"use client";

import type { ReactNode } from "react";
import { logAdClick } from "@/lib/actions/log-search";

export function AdLink({ href, campaignId, className, children }: { href: string; campaignId: string; className?: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={className}
      onClick={() => {
        void logAdClick(campaignId);
      }}
    >
      {children}
    </a>
  );
}
