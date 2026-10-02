"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { logPortalPageView } from "@/lib/actions/log-search";

/** Dispara uma visita por página aberta na aba; só roda no navegador, então robôs sem JS não contam. */
export function PortalPageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    try {
      const key = `pv:${pathname}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage bloqueado: conta a visita mesmo assim
    }
    const utmSource = new URLSearchParams(window.location.search).get("utm_source") ?? "";
    void logPortalPageView(pathname, document.referrer, utmSource);
  }, [pathname]);

  return null;
}
