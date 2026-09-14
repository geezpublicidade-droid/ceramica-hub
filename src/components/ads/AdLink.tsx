"use client";

import type { ReactNode } from "react";
import { TrackedLink } from "@/components/TrackedLink";
import { logAdClick } from "@/lib/actions/log-search";

export function AdLink({ href, campaignId, className, children }: { href: string; campaignId: string; className?: string; children: ReactNode }) {
  return (
    <TrackedLink href={href} className={className} rel="noopener noreferrer sponsored" onTrack={() => void logAdClick(campaignId)}>
      {children}
    </TrackedLink>
  );
}
