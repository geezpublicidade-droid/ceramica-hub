/**
 * Atribuição de visita a posição paga: o card leva `?pl=<placementId>` ao perfil, e o
 * perfil lembra disso durante a sessão para creditar telefone/site/rota/WhatsApp à posição.
 * Só roda no navegador; qualquer falha de storage (modo privado) significa "sem atribuição".
 */
const KEY_PREFIX = "ceramica:pl:";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isPlacementId(value: string | null | undefined): value is string {
  return Boolean(value && UUID_RE.test(value));
}

export function rememberPlacement(businessId: string, placementId: string): void {
  try {
    sessionStorage.setItem(KEY_PREFIX + businessId, placementId);
  } catch {
    // sem storage: segue sem atribuição
  }
}

export function recallPlacement(businessId: string): string | undefined {
  try {
    const value = sessionStorage.getItem(KEY_PREFIX + businessId);
    return isPlacementId(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

/** Marca a visita ao perfil como já contada nesta sessão; devolve false se já tinha sido (evita contar 2x em recarga ou efeito duplicado). */
export function markProfileViewCounted(placementId: string): boolean {
  const key = `${KEY_PREFIX}view:${placementId}`;
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
  } catch {
    // sem storage: conta (melhor contar a mais uma vez do que perder a visita)
  }
  return true;
}
