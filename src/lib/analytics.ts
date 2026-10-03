/**
 * Medição de marketing (Google Analytics 4 e Meta Pixel). As contas são configuradas por variável de ambiente
 * (`NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_META_PIXEL_ID`), então trocar de conta é só trocar o valor. Nada carrega sem
 * a pessoa aceitar os cookies; sem ID configurado, tudo aqui é um no-op silencioso.
 */

/** IDs só com letras, números e hífen (G-XXXXXXX, 1234567890): impede que um valor errado vire código na página. */
function cleanId(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && /^[A-Za-z0-9-]{4,40}$/.test(trimmed) ? trimmed : null;
}

export const GA_ID = cleanId(process.env.NEXT_PUBLIC_GA_ID);
export const META_PIXEL_ID = cleanId(process.env.NEXT_PUBLIC_META_PIXEL_ID);
export const ANALYTICS_ENABLED = Boolean(GA_ID || META_PIXEL_ID);

export const CONSENT_STORAGE_KEY = "ceramica:consent:v1";
export const CONSENT_EVENT = "ceramica:consent";

/** Eventos de negócio do Hub e como cada um vira evento padrão no Google e na Meta. */
export type TrackedEvent =
  | { name: "search"; term: string }
  | { name: "view_profile"; businessName: string; category: string }
  | { name: "contact"; method: "whatsapp" | "phone" | "website" | "directions"; businessName?: string }
  | { name: "lead_form"; form: string };

type Gtag = (command: string, name: string, params?: Record<string, unknown>) => void;
type Fbq = (command: string, name: string, params?: Record<string, unknown>) => void;

declare global {
  interface Window {
    gtag?: Gtag;
    fbq?: Fbq;
  }
}

/** Dispara o evento nas ferramentas carregadas (só existem depois do aceite). Nunca lança erro. */
export function track(event: TrackedEvent): void {
  if (typeof window === "undefined") return;
  try {
    switch (event.name) {
      case "search":
        window.gtag?.("event", "search", { search_term: event.term });
        window.fbq?.("track", "Search", { search_string: event.term });
        break;
      case "view_profile":
        window.gtag?.("event", "view_item", { item_name: event.businessName, item_category: event.category });
        window.fbq?.("track", "ViewContent", { content_name: event.businessName, content_category: event.category });
        break;
      case "contact":
        window.gtag?.("event", "generate_lead", { method: event.method, item_name: event.businessName });
        window.fbq?.("track", "Contact", { method: event.method, content_name: event.businessName });
        break;
      case "lead_form":
        window.gtag?.("event", "generate_lead", { method: "formulario", form: event.form });
        window.fbq?.("track", "Lead", { content_name: event.form });
        break;
    }
  } catch {
    // medição nunca pode quebrar a página
  }
}
