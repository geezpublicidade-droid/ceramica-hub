"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & { prompt: () => Promise<void> };

/** Botão "Instalar app": só aparece quando o navegador oferece a instalação. */
export function PwaInstallButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => setPromptEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!promptEvent) return null;
  return (
    <button
      type="button"
      onClick={() => promptEvent.prompt().catch(() => setPromptEvent(null))}
      className="neu rounded-full px-4 py-2 text-[14px] font-medium text-foreground"
    >
      Instalar app
    </button>
  );
}
