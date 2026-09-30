export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  /** Cabeçalhos extras, ex: List-Unsubscribe nos disparos de marketing. */
  headers?: Record<string, string>;
};

export type SendEmailResult = { ok: true; providerId: string | null } | { ok: false; error: string };

/**
 * Envio de e-mail via Resend (API HTTP direta, sem SDK -- mesmo padrão de
 * mercadopago.ts: se RESEND_API_KEY não estiver configurado, não lança erro,
 * só devolve `ok: false`). Precisa de um domínio verificado no Resend pra
 * RESEND_FROM_EMAIL funcionar de verdade.
 */
export async function sendEmailDetailed(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY não configurado — e-mail não enviado.");
    return { ok: false, error: "RESEND_API_KEY não configurado." };
  }

  const from = process.env.RESEND_FROM_EMAIL || "Cerâmica Hub <nao-responda@ceramicahub.com.br>";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: input.to, subject: input.subject, html: input.html, headers: input.headers }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("[email] falha ao enviar:", detail);
      return { ok: false, error: detail.slice(0, 300) };
    }
    const body = (await response.json().catch(() => null)) as { id?: string } | null;
    return { ok: true, providerId: body?.id ?? null };
  } catch (err) {
    console.error("[email] erro ao enviar:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido." };
  }
}

/** Versão simples pra e-mail transacional: só interessa se enviou. */
export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  return (await sendEmailDetailed(input)).ok;
}
