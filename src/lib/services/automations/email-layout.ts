import { siteUrl } from "@/lib/seo";
import { escapeHtml, unsubscribeUrl } from "@/lib/services/email-marketing";

export { escapeHtml };

export const absoluteUrl = (path: string): string => `${siteUrl}${path}`;

type EmailParts = {
  title: string;
  /** HTML já escapado pelo chamador. */
  bodyHtml: string;
  cta?: { label: string; href: string };
  /** Token de descadastro: só e-mails pra empresas levam rodapé de cancelamento. */
  unsubscribeToken?: string | null;
};

/** Moldura única dos e-mails automáticos (mesma paleta terracota do site). */
export function renderAutomationEmail({ title, bodyHtml, cta, unsubscribeToken }: EmailParts): string {
  const button = cta
    ? `<p style="margin:24px 0"><a href="${cta.href}" style="background:#b76546;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600">${escapeHtml(cta.label)}</a></p>`
    : "";
  const footer = unsubscribeToken
    ? `<hr style="margin:32px 0 16px;border:none;border-top:1px solid #e5e0d8" />
<p style="font-size:12px;color:#7a746c;line-height:1.5">Você recebe este aviso por ter uma empresa no Cerâmica Hub. <a href="${unsubscribeUrl(unsubscribeToken)}" style="color:#b76546">Não quero mais receber e-mails</a>.</p>`
    : "";
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#2b2622">
<h2 style="font-size:20px;margin:0 0 16px">${escapeHtml(title)}</h2>
<div style="font-size:15px;line-height:1.6">${bodyHtml}</div>
${button}${footer}
</div>`;
}
