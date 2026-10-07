"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

const SEEN_KEY = "ceramica:intro-seen";
const COVER_MS = 650;
const REVEAL_MS = 750;
const EASE = "cubic-bezier(.7,0,.2,1)";
// mesmo tom de fundo do vídeo, para não aparecer emenda
const BACKGROUND = "#f1ebe5";

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
  const [done, setDone] = useState(false);
  const visible = !skipped && !closed;
  const videoRef = useRef<HTMLVideoElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);

  /** Sai com a transição terracota: um círculo nasce no centro e cobre o vídeo; aí o vídeo some e o círculo recolhe revelando a home. */
  const close = () => {
    if (leaving) return;
    markSeen();
    setLeaving(true);
    const veil = veilRef.current;
    if (!veil) {
      setClosed(true);
      setDone(true);
      return;
    }
    const radius = Math.hypot(window.innerWidth, window.innerHeight) / 2;
    const at = (r: number) => `circle(${r}px at 50% 50%)`;
    veil.style.visibility = "visible";
    const cover = veil.animate([{ clipPath: at(0) }, { clipPath: at(radius) }], { duration: COVER_MS, easing: EASE, fill: "both" });
    cover.onfinish = () => {
      setClosed(true); // o fundo e o vídeo saem por baixo do véu
      const reveal = veil.animate([{ clipPath: at(radius) }, { clipPath: at(0) }], { duration: REVEAL_MS, easing: EASE, fill: "both" });
      reveal.onfinish = () => setDone(true);
    };
  };

  useEffect(() => {
    if (!visible) return;
    document.body.style.overflow = "hidden";
    void videoRef.current?.play().catch(() => setClosed(true));
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  if (skipped || done) return null;

  return (
    <>
      {visible && (
        <div role="dialog" aria-label={t("label")} style={{ backgroundColor: BACKGROUND }} className="fixed inset-0 z-[100]">
          <video ref={videoRef} src="/videos/abertura.mp4" muted playsInline autoPlay preload="auto" onEnded={close} onError={close} className="h-full w-full object-contain" />
          <button type="button" onClick={close} className="absolute bottom-6 right-6 rounded-full bg-foreground/10 px-5 py-2.5 text-[15px] font-medium text-foreground backdrop-blur transition-colors hover:bg-foreground/20">
            {t("skip")}
          </button>
        </div>
      )}
      <div ref={veilRef} aria-hidden="true" style={{ visibility: "hidden", clipPath: "circle(0px at 50% 50%)" }} className="pointer-events-none fixed inset-0 z-[101] bg-primary" />
    </>
  );
}
