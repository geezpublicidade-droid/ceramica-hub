"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ANALYTICS_ENABLED, CONSENT_EVENT, CONSENT_STORAGE_KEY, GA_ID, META_PIXEL_ID } from "@/lib/analytics";

type Consent = "granted" | "denied" | "unknown" | "server";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CONSENT_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CONSENT_EVENT, onChange);
  };
}

function readConsent(): Consent {
  try {
    const value = localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : "unknown";
  } catch {
    // armazenamento bloqueado: trata como "sem resposta" (nada é carregado)
    return "unknown";
  }
}

function saveConsent(value: "granted" | "denied") {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch {
    // sem armazenamento: a escolha vale só até recarregar
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

const GA_BOOT = (id: string) =>
  `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${id}',{anonymize_ip:true});`;

const PIXEL_BOOT = (id: string) =>
  `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView');`;

/**
 * Aviso de cookies (LGPD) + carregamento do Google Analytics e do Meta Pixel só depois do aceite.
 * Sem nenhum ID configurado nas variáveis de ambiente, não mostra aviso nem carrega nada.
 */
export function ConsentManager() {
  const t = useTranslations("Consent");
  const pathname = usePathname();
  const firstPath = useRef(true);
  const consent = useSyncExternalStore<Consent>(subscribe, readConsent, () => "server");

  // navegação interna (SPA) conta como nova página no Pixel; o GA4 já acompanha o histórico sozinho
  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    if (consent === "granted") window.fbq?.("track", "PageView");
  }, [pathname, consent]);

  if (!ANALYTICS_ENABLED) return null;

  return (
    <>
      {consent === "granted" && GA_ID && (
        <>
          <Script id="ga-loader" src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-boot" strategy="afterInteractive">
            {GA_BOOT(GA_ID)}
          </Script>
        </>
      )}
      {consent === "granted" && META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {PIXEL_BOOT(META_PIXEL_ID)}
        </Script>
      )}

      {consent === "unknown" && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label={t("title")}
          className="fixed inset-x-3 bottom-3 z-[90] mx-auto flex max-w-3xl flex-col gap-3 rounded-3xl border border-border bg-white p-5 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.45)] sm:flex-row sm:items-center sm:gap-5"
        >
          <p className="flex-1 text-[14px] leading-relaxed text-foreground">
            {t("text")}{" "}
            <Link href="/privacidade" className="font-medium text-primary underline underline-offset-4">
              {t("policy")}
            </Link>
          </p>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => saveConsent("denied")} className="neu min-h-11 rounded-full px-5 text-[14px] font-medium text-foreground">
              {t("decline")}
            </button>
            <button type="button" onClick={() => saveConsent("granted")} className="neu-primary min-h-11 rounded-full px-5 text-[14px] font-medium text-white">
              {t("accept")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
