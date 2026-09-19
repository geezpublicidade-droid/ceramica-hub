/**
 * Envio de e-mail transacional via Resend (API HTTP direta, sem SDK -- mesmo
 * padrão de mercadopago.ts: se RESEND_API_KEY não estiver configurado,
 * retorna false em vez de lançar erro, só loga um aviso). Precisa de um
 * domínio verificado no Resend pra RESEND_FROM_EMAIL funcionar de verdade.
 */
export async function sendEmail(input: { to: string; subject: string; html: string }): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY não configurado — e-mail não enviado.");
    return false;
  }

  const from = process.env.RESEND_FROM_EMAIL || "Cerâmica Hub <nao-responda@ceramicahub.com.br>";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: input.to, subject: input.subject, html: input.html }),
    });

    if (!response.ok) {
      console.error("[email] falha ao enviar:", await response.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] erro ao enviar:", err);
    return false;
  }
}
