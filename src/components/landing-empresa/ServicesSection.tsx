import { getTranslations } from "next-intl/server";
import { serviceWhatsappMessage, whatsappUrl } from "@/lib/landing/whatsapp";
import { SECTION_TITLE, type LandingContext } from "./context";
import { ServicesGrid, type ServiceCard } from "./ServicesGrid";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export async function ServicesSection({ ctx }: { ctx: LandingContext }) {
  const { services } = ctx.data;
  if (services.length === 0) return null;

  const t = await getTranslations("LandingEmpresa");
  const items: ServiceCard[] = services.map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description,
    photo: service.photo,
    priceLabel: service.startingPrice != null ? t("priceFrom", { price: BRL.format(service.startingPrice) }) : null,
    duration: service.duration ?? null,
    ctaLabel: service.ctaLabel ?? null,
    href: whatsappUrl(ctx.whatsappPhone, serviceWhatsappMessage(service.name)),
  }));

  return (
    <section id="servicos" className="container-page scroll-mt-24 py-12 sm:py-16">
      <h2 className={`mb-6 ${SECTION_TITLE}`}>{t("servicesTitle")}</h2>
      <ServicesGrid businessId={ctx.business.id} items={items} />
    </section>
  );
}
