"use client";

import { useEffect } from "react";
import { REFERRAL_COOKIE, REFERRAL_COOKIE_DAYS, normalizeReferralCode } from "@/lib/services/referral-code";

/** Guarda o código de `?ref=` num cookie de 30 dias, para o cadastro de empresa creditar a indicação. */
export function ReferralCapture() {
  useEffect(() => {
    const code = normalizeReferralCode(new URLSearchParams(window.location.search).get("ref"));
    if (!code) return;
    const maxAge = REFERRAL_COOKIE_DAYS * 24 * 60 * 60;
    document.cookie = `${REFERRAL_COOKIE}=${code}; path=/; max-age=${maxAge}; SameSite=Lax`;
  }, []);
  return null;
}
