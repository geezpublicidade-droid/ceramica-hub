/**
 * Verificação server-side do token do Cloudflare Turnstile. Se
 * `TURNSTILE_SECRET_KEY` não estiver configurado, a verificação é pulada
 * (log de aviso) em vez de bloquear o cadastro — assim o código já fica no
 * ar antes da chave existir, sem quebrar o fluxo público.
 */
export async function verifyTurnstileToken(token: string | null | undefined): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.warn("[turnstile] TURNSTILE_SECRET_KEY não configurado — verificação pulada.");
    return true;
  }
  if (!token) return false;

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: secretKey, response: token }),
    });
    const result = (await response.json()) as { success: boolean };
    return result.success;
  } catch (err) {
    console.error("[turnstile] falha ao verificar token:", err);
    return false;
  }
}
