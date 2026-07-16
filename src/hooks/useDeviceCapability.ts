"use client";

import { useSyncExternalStore } from "react";
import { useReducedMotion } from "./useReducedMotion";

export type DeviceCapability = {
  /** true assim que a checagem no cliente termina; antes disso, nada de 3D é montado */
  ready: boolean;
  supportsWebGL: boolean;
  isLowEndDevice: boolean;
  isTouch: boolean;
  reducedMotion: boolean;
  /** decisão final: pode montar a cena 3D? */
  shouldRender3D: boolean;
};

type RawCapability = {
  supportsWebGL: boolean;
  isLowEndDevice: boolean;
  isTouch: boolean;
};

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    return Boolean(gl);
  } catch {
    return false;
  }
}

function detectLowEnd(): boolean {
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  return cores <= 4 || memory <= 4;
}

// capacidades de hardware não mudam durante a sessão — computa uma vez e cacheia,
// já que useSyncExternalStore exige que getSnapshot retorne a mesma referência
// quando nada mudou.
let cachedCapability: RawCapability | null = null;

function getSnapshot(): RawCapability {
  if (!cachedCapability) {
    cachedCapability = {
      supportsWebGL: detectWebGL(),
      isLowEndDevice: detectLowEnd(),
      isTouch: window.matchMedia("(pointer: coarse)").matches,
    };
  }
  return cachedCapability;
}

function getServerSnapshot(): RawCapability | null {
  return null;
}

function subscribe() {
  return () => {};
}

export function useDeviceCapability(): DeviceCapability {
  const reducedMotion = useReducedMotion();
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!raw) {
    return {
      ready: false,
      supportsWebGL: false,
      isLowEndDevice: false,
      isTouch: false,
      reducedMotion,
      shouldRender3D: false,
    };
  }

  return {
    ready: true,
    ...raw,
    reducedMotion,
    shouldRender3D: raw.supportsWebGL && !raw.isLowEndDevice && !reducedMotion,
  };
}
