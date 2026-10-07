import { MapPin, MessageCircle, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ContactLink } from "@/components/ContactLink";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import type { LandingContext } from "./context";

/** Barra fixa no celular (WhatsApp, ligar, como chegar) e botão de WhatsApp discreto no desktop. Só mostra o que o plano libera. */
export async function FloatingActions({ ctx }: { ctx: LandingContext }) {
  const t = await getTranslations("LandingEmpresa");
  const { business } = ctx;
  const { whatsapp, commercialInfo } = ctx.data.capabilities;
  const showPhone = Boolean(ctx.phoneDigits) && commercialInfo;
  if (!whatsapp && !showPhone && !ctx.directionsUrl) return null;

  const itemClass = "flex flex-1 flex-col items-center gap-1 py-2.5 text-[12px] font-medium text-foreground";

  return (
    <>
      <nav aria-label={t("floatWhatsapp")} className="fixed inset-x-0 bottom-0 z-40 flex border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {whatsapp && (
          <WhatsAppLink href={ctx.whatsappHref} businessId={business.id} businessName={business.name} className={`${itemClass} text-whatsapp`}>
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            {t("floatWhatsapp")}
          </WhatsAppLink>
        )}
        {showPhone && (
          <ContactLink href={`tel:${ctx.phoneDigits}`} businessId={business.id} kind="phone" className={itemClass}>
            <Phone className="h-5 w-5" aria-hidden="true" />
            {t("floatCall")}
          </ContactLink>
        )}
        {ctx.directionsUrl && (
          <ContactLink href={ctx.directionsUrl} businessId={business.id} kind="directions" className={itemClass}>
            <MapPin className="h-5 w-5" aria-hidden="true" />
            {t("floatDirections")}
          </ContactLink>
        )}
      </nav>
      {whatsapp && (
        <WhatsAppLink
          href={ctx.whatsappHref}
          businessId={business.id}
          businessName={business.name}
          className="fixed bottom-6 right-6 z-40 hidden h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg transition hover:bg-whatsapp-hover md:flex"
        >
          <MessageCircle className="h-7 w-7" aria-hidden="true" />
          <span className="sr-only">{t("whatsappCta")}</span>
        </WhatsAppLink>
      )}
    </>
  );
}
