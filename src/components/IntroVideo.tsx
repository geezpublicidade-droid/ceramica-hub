"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

const SEEN_KEY = "ceramica:intro-seen";
const FADE_MS = 800;

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
  const [leaving, setLeaving] = useState(false);
  const [closed, setClosed] = useState(false);
  const visible = !skipped && !closed;
  const videoRef = useRef<HTMLVideoElement>(null);

/** Sai com fade + leve zoom do vídeo, revelando o site por baixo; só depois desmonta. */
  const close = () => {
    if (leaving) return;
    markSeen();
    setLeaving(true);
    window.setTimeout(() => setClosed(true), FADE_MS);
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
    <div role="dialog" aria-label={t("label")} style={{ transitionDuration: `${FADE_MS}ms` }} className={`fixed inset-0 z-[100] bg-black transition-opacity ease-out ${leaving ? "opacity-0" : "opacity-100"}`}>
      <video ref={videoRef} src="/videos/abertura.mp4" muted playsInline autoPlay preload="auto" onEnded={close} onError={close} style={{ transitionDuration: `${FADE_MS}ms` }} className={`h-full w-full object-cover transition-transform ease-out ${leaving ? "scale-110" : "scale-100"}`} />
      <button type="button" onClick={close} className="absolute bottom-6 right-6 rounded-full bg-white/15 px-5 py-2.5 text-[15px] font-medium text-white backdrop-blur transition-colors hover:bg-white/25">
        {t("skip")}
      </button>
    </div>
  );
}
