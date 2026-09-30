import type { AutomationKey } from "./registry";

/** Um e-mail a enviar. `build` só roda depois da reserva (claim), então trabalho caro não se repete. */
export type AutomationJob = {
  automation: AutomationKey;
  /** Identifica o fato que motivou o aviso; junto do destinatário, garante envio único. */
  dedupeKey: string;
  to: string;
  businessId?: string | null;
  build: (unsubscribeToken: string | null) => Promise<{ subject: string; html: string }>;
};
