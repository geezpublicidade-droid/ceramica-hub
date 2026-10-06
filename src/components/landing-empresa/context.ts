import type { Business } from "@/data/businesses";
import type { LandingData } from "@/lib/services/landing";
import type { VirtualTourScene } from "@/lib/services/platform";

/** Tudo que as seções da landing precisam, resolvido uma vez na página. */
export type LandingContext = {
  business: Business;
  data: LandingData;
  /** wa.me já com a mensagem padrão da empresa */
  whatsappHref: string;
  /** número do WhatsApp só com dígitos (para montar mensagens de serviço/oferta) */
  whatsappPhone: string;
  phoneDigits: string;
  directionsUrl: string | null;
  mapEmbedUrl: string | null;
  address: string | null;
  categoryLabel: string;
  /** cenas do tour 3D (só entram se o plano permitir) */
  tourScenes: VirtualTourScene[];
  canonicalUrl: string;
};

export const WHATSAPP_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-md bg-whatsapp px-6 py-3.5 text-[15px] font-semibold text-white transition hover:bg-whatsapp-hover";
export const OUTLINE_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-md border border-primary px-6 py-3.5 text-[15px] font-semibold text-primary transition hover:bg-primary/5";
export const SECTION_TITLE = "text-[clamp(1.5rem,2.6vw,2rem)] font-semibold leading-tight tracking-tight text-foreground";
export const EYEBROW = "text-[12px] font-semibold uppercase tracking-[0.2em] text-primary";
