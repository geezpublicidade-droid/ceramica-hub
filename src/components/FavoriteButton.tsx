"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getFavoriteStatus, toggleFavoriteAction } from "@/lib/actions/member-favorites";

// A página da empresa é ISR cacheada (revalidate=60) e não pode ler sessão
// no server sem virar dinâmica pra todo mundo — por isso o status de
// favorito só chega depois, num fetch client-side, em vez de vir pronto no
// HTML. Fica um instante em estado neutro (cinza) antes de saber se já é
// favorito.
// `overlay` = versão compacta sobre a capa do card: só consulta o status quando entra na tela
// (uma listagem tem vários cards; consultar todos de uma vez enfileira várias server actions).
export function FavoriteButton({ businessId, overlay = false }: { businessId: string; overlay?: boolean }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(!overlay);
  const [favorited, setFavorited] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const element = buttonRef.current;
    if (visible || !element) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setVisible(true);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    getFavoriteStatus(businessId).then((value) => {
      if (active) setFavorited(value);
    });
    return () => {
      active = false;
    };
  }, [businessId, visible]);

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
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      disabled={pending || favorited === null}
      aria-pressed={favorited === true}
      aria-label={favorited ? "Remover dos favoritos" : "Favoritar esta empresa"}
      className={`flex shrink-0 items-center justify-center rounded-full disabled:opacity-50 ${
        overlay ? "h-10 w-10 bg-white/90 backdrop-blur-sm" : "neu h-[52px] w-[52px]"
      } ${favorited ? "text-red-500" : "text-foreground"}`}
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
