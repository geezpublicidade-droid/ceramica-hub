"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getFavoriteStatus, toggleFavoriteAction } from "@/lib/actions/member-favorites";

// A página da empresa é ISR cacheada (revalidate=60) e não pode ler sessão
// no server sem virar dinâmica pra todo mundo — por isso o status de
// favorito só chega depois, num fetch client-side, em vez de vir pronto no
// HTML. Fica um instante em estado neutro (cinza) antes de saber se já é
// favorito.
export function FavoriteButton({ businessId }: { businessId: string }) {
  const [favorited, setFavorited] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    getFavoriteStatus(businessId).then((value) => {
      if (active) setFavorited(value);
    });
    return () => {
      active = false;
    };
  }, [businessId]);

  function handleClick() {
    if (favorited === null) return;
    startTransition(async () => {
      const result = await toggleFavoriteAction(businessId, favorited);
      if ("loggedOut" in result) {
        router.push(`/membro/login?callbackUrl=${encodeURIComponent(pathname)}`);
        return;
      }
      setFavorited(result.favorited);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending || favorited === null}
      aria-pressed={favorited === true}
      aria-label={favorited ? "Remover dos favoritos" : "Favoritar esta empresa"}
      className={`neu flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full disabled:opacity-50 ${
        favorited ? "text-red-500" : "text-foreground"
      }`}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={favorited ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z" />
      </svg>
    </button>
  );
}
