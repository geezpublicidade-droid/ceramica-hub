/** Primeiro IP do `x-forwarded-for` (o da ponta do cliente); sem cabeçalho, "unknown". */
export function clientIpFrom(forwardedFor: string | null | undefined): string {
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}

/** Chave de contador: escopo da rota + IP. */
export function rateLimitKey(scope: string, ip: string): string {
  return `${scope}:${ip}`;
}
