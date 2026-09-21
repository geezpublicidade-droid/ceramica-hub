"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BusinessAvatar } from "@/components/BusinessAvatar";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { toggleFavoriteAction } from "@/lib/actions/member-favorites";
import type { Business } from "@/data/businesses";

/** Card de favorito na home do membro -- diferente do FavoriteButton (que
 * fica na página pública da empresa e não sabe o estado de antemão), aqui
 * `business` já veio da própria lista de favoritos do membro, então "tirar
 * dos favoritos" não precisa checar status antes, só chama a action com
 * `currentlyFavorited=true` direto. */
export function FavoriteCard({ business }: { business: Business }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      await toggleFavoriteAction(business.id, true);
      router.refresh();
    });
  }

  return (
    <div className="glass-light flex gap-4 rounded-2xl p-4">
      <Link href={`/empresa/${business.slug}`} className="shrink-0">
        <BusinessAvatar
          business={business}
          className="h-14 w-14 rounded-full bg-white"
          textClassName="text-[15px] font-semibold text-foreground"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/empresa/${business.slug}`} className="min-w-0">
            <p className="truncate font-semibold text-foreground hover:text-primary">{business.name}</p>
          </Link>
          <button
            type="button"
            onClick={handleRemove}
            disabled={isPending}
            aria-label="Remover dos favoritos"
            className="shrink-0 text-red-500 transition-opacity hover:opacity-70 disabled:opacity-40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z" />
            </svg>
          </button>
        </div>
        <p className="text-[14px] text-muted">{business.category}</p>
        <WhatsAppLink
          href={buildWhatsAppLink(business.phone, business.name)}
          businessId={business.id}
          className="mt-2 inline-flex items-center gap-1.5 text-[14px] font-medium text-primary transition-transform hover:translate-x-1"
        >
          Chamar no WhatsApp
          <span aria-hidden="true">→</span>
        </WhatsAppLink>
      </div>
    </div>
  );
}
