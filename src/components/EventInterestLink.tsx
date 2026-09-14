"use client";

import type { ReactNode } from "react";
import { TrackedLink } from "@/components/TrackedLink";
import { logEventInterest } from "@/lib/actions/log-search";

type EventInterestLinkProps = {
  href: string;
  eventId: string;
  className?: string;
  children: ReactNode;
};

export function EventInterestLink({ href, eventId, className, children }: EventInterestLinkProps) {
  return (
    <TrackedLink href={href} className={className} onTrack={() => void logEventInterest(eventId)}>
      {children}
    </TrackedLink>
  );
}
