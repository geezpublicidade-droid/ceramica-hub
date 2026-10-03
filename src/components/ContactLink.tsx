"use client";

import type { ReactNode } from "react";
import { TrackedLink } from "@/components/TrackedLink";
import { logContactClick, type ContactClickKind } from "@/lib/actions/log-search";
import { recallPlacement } from "@/lib/placement-attribution";

type ContactLinkProps = {
  href: string;
  businessId: string;
  kind: ContactClickKind;
  className?: string;
  children: ReactNode;
};

/** Telefone, site ou rota da empresa -- loga o clique pro portal de resultados. */
export function ContactLink({ href, businessId, kind, className, children }: ContactLinkProps) {
  return (
    <TrackedLink href={href} className={className} onTrack={() => void logContactClick(businessId, kind, recallPlacement(businessId))}>
      {children}
    </TrackedLink>
  );
}
