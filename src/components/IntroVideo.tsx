"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

const SEEN_KEY = "ceramica:intro-seen";

const markSeen = () => {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // navegação privada/sem storage: só toca de novo na próxima visita
  }
};

/** Já viu nesta sessão, ou prefere menos movimento. No servidor assume "não viu" para o vídeo já sair no HTML. */
function alreadySkipped(): boolean {
  try {
    if (sessionStorage.getItem(SEEN_KEY) === "1") return true;
  } catch {
    // sem storage: mostra
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
const subscribeNothing = () => () => undefined;

/**
 * Vídeo de abertura em tela cheia: toca uma vez por sessão, sem som (autoplay exige), some sozinho ao terminar
 * e tem botão "Pular". Quem prefere menos movimento não vê o vídeo.
 */
export function IntroVideo() {
  const t = useTranslations("IntroVideo");
  const skipped = useSyncExternalStore(subscribeNothing, alreadySkipped, () => false);
  const [closed, setClosed] = useState(false);
  const visible = !skipped && !closed;
  const videoRef = useRef<HTMLVideoElement>(null);

  const close = () => {
    markSeen();
    setClosed(true);
  };

  useEffect(() => {
    if (!visible) return;
    document.body.style.overflow = "hidden";
    void videoRef.current?.play().catch(() => setClosed(true));
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div role="dialog" aria-label={t("label")} className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
      <video ref={videoRef} src="/videos/abertura.mp4" muted playsInline autoPlay preload="auto" onEnded={close} onError={close} className="h-full w-full object-contain" />
      <button type="button" onClick={close} className="absolute bottom-6 right-6 rounded-full bg-white/15 px-5 py-2.5 text-[15px] font-medium text-white backdrop-blur transition-colors hover:bg-white/25">
        {t("skip")}
      </button>
    </div>
  );
}
