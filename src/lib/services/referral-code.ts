/** Parte do programa de indicações sem acesso a banco, segura para importar em componentes de cliente. */

export const REFERRAL_COOKIE = "ch_ref";
export const REFERRAL_COOKIE_DAYS = 30;

const CODE_PATTERN = /^[A-Z0-9]{6,12}$/;

export function normalizeReferralCode(raw: string | null | undefined): string | null {
  const code = raw?.trim().toUpperCase() ?? "";
  return CODE_PATTERN.test(code) ? code : null;
}
