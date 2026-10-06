import { ArrowRight, MapPin, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { WHATSAPP_BUTTON, type LandingContext } from "./context";
import { LeadForm } from "./LeadForm";

/** Fechamento da página: título forte, botão de WhatsApp e, quando ativo no plano, o formulário de pedido de contato. */
export async function FinalCta({ ctx }: { ctx: LandingContext }) {
  const t = await getTranslations("LandingEmpresa");
  const { business, data } = ctx;
  const { config, capabilities } = data;
  const showForm = capabilities.leadForm && config.leadFormEnabled;

  return (
    <section id="contato" className="scroll-mt-24 bg-[#f1e9df]">
      <div className={`container-page grid gap-10 py-12 sm:py-16 ${showForm ? "lg:grid-cols-2" : ""}`}>
        <div className="flex flex-col justify-center gap-5">
          <h2 className="max-w-xl text-[clamp(1.8rem,3.4vw,2.6rem)] font-semibold leading-tight tracking-tight text-foreground">
            {config.finalCtaTitle ?? t("finalTitle", { name: business.name })}
          </h2>
          <p className="max-w-lg text-[16.5px] leading-relaxed text-foreground/75">{config.finalCtaText ?? t("finalText")}</p>
          <div>
            <WhatsAppLink href={ctx.whatsappHref} businessId={business.id} businessName={business.name} className={WHATSAPP_BUTTON}>
              {config.finalCtaLabel ?? t("finalCta")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </WhatsAppLink>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] text-foreground/70">
            {business.verified && (
              <li className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                {t("verified")}
              </li>
            )}
            <li className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
              {t("inEspaco")}
            </li>
          </ul>
        </div>
        {showForm && (
          <div className="rounded-md border border-black/[0.07] bg-white p-6 sm:p-8">
            <h3 className="mb-5 text-[18px] font-semibold tracking-tight">{t("leadTitle")}</h3>
            <LeadForm businessId={business.id} businessName={business.name} services={data.services.map((s) => ({ id: s.id, name: s.name }))} />
          </div>
        )}
      </div>
    </section>
  );
}
