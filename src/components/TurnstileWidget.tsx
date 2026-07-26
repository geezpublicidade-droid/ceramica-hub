"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: { sitekey: string; callback: (token: string) => void; "expired-callback"?: () => void }
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

/** Sem site key configurada ainda (NEXT_PUBLIC_TURNSTILE_SITE_KEY), o widget simplesmente não renderiza — não bloqueia o formulário enquanto a chave não existe. */
export function TurnstileWidget({ onVerify }: { onVerify: (token: string | null) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (!siteKey || !scriptLoaded || !containerRef.current || !window.turnstile || widgetIdRef.current) return;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token) => onVerify(token),
      "expired-callback": () => onVerify(null),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptLoaded, siteKey]);

  if (!siteKey) return null;

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer onLoad={() => setScriptLoaded(true)} />
      <div ref={containerRef} />
    </>
  );
}
