"use client";

import { useEffect } from "react";

/** Registra o service worker em produção, o que torna o site instalável como app. */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((error) => console.error("[pwa] falha ao registrar:", error));
  }, []);
  return null;
}
