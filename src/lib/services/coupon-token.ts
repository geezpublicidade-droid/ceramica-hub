import { siteUrl } from "@/lib/seo";

/** Parte do clube de benefícios sem acesso a banco, segura para importar em componentes de cliente. */

export type ClaimStatus = "revelado" | "utilizado";

const TOKEN_PATTERN = /^[0-9a-f]{32}$/;

export function normalizeClaimToken(raw: string | null | undefined): string | null {
  const token = raw?.trim().toLowerCase() ?? "";
  return TOKEN_PATTERN.test(token) ? token : null;
}

export function claimValidationUrl(token: string): string {
  return `${siteUrl}/dashboard/cupons?validar=${token}`;
}
