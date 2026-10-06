import { ArrowRight, BadgeCheck, MapPin, Tag } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { BusinessAvatar } from "@/components/BusinessAvatar";
import { FavoriteButton } from "@/components/FavoriteButton";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { Link } from "@/i18n/navigation";
import { isOpenNow } from "@/lib/landing/hours";
import { serviceWhatsappMessage, whatsappUrl } from "@/lib/landing/whatsapp";
import { OUTLINE_BUTTON, WHATSAPP_BUTTON, type LandingContext } from "./context";

type SecondaryCta = { label: string; href: string; external: boolean };

/** Botão secundário configurável: serviços/cardápio rolam até os serviços; orçamento/agendar vão ao formulário, ao link de agenda ou ao WhatsApp. */
function secondaryCta(ctx: LandingContext, t: Awaited<ReturnType<typeof getTranslations>>): SecondaryCta {
  const { config, capabilities } = ctx.data;
  const hasForm = capabilities.leadForm && config.leadFormEnabled;
  const label = (key: "heroCtaServices" | "heroCtaQuote" | "heroCtaBooking" | "heroCtaMenu") => config.heroCtaLabel ?? t(key);

  switch (config.heroCtaKind) {
    case "orcamento":
      return hasForm
        ? { label: label("heroCtaQuote"), href: "#contato", external: false }
        : { label: label("heroCtaQuote"), href: whatsappUrl(ctx.whatsappPhone, serviceWhatsappMessage("um orçamento")), external: true };
    case "agendar":
      return ctx.business.bookingUrl
        ? { label: label("heroCtaBooking"), href: ctx.business.bookingUrl, external: true }
        : { label: label("heroCtaBooking"), href: hasForm ? "#contato" : ctx.whatsappHref, external: !hasForm };
    case "cardapio":
      return { label: label("heroCtaMenu"), href: "#servicos", external: false };
    default:
      return { label: label("heroCtaServices"), href: "#servicos", external: false };
  }
}

function HeroImage({ ctx }: { ctx: LandingContext }) {
  const { business, data } = ctx;
  const image = data.capabilities.customCover ? (data.config.heroImageUrl ?? business.coverPhoto) : null;

  if (!image) {
    return (
      <div className="relative hidden min-h-[360px] items-center justify-center bg-surface lg:flex">
        <BusinessAvatar business={business} className="h-40 w-40 rounded-md bg-white shadow-sm" textClassName="text-[44px] font-semibold text-primary" />
      </div>
    );
  }
  return (
    <div className="relative min-h-[260px] lg:min-h-[420px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt={business.name} fetchPriority="high" className="absolute inset-0 h-full w-full object-cover lg:[mask-image:linear-gradient(to_right,transparent,black_38%)]" />
    </div>
  );
}

export async function Hero({ ctx }: { ctx: LandingContext }) {
  const [t, tPage, tCategories] = await Promise.all([getTranslations("LandingEmpresa"), getTranslations("EmpresaPage"), getTranslations("categories")]);
  const { business, data } = ctx;
  const { config } = data;
  const secondary = secondaryCta(ctx, t);
  const open = isOpenNow(config.openingSchedule);
  const subtitle = config.heroSubtitle ?? business.description;

  return (
    <section className="relative overflow-hidden bg-[#fbf9f6]">
      <div className="grid lg:grid-cols-[1.05fr_1fr]">
        <div className="container-page flex flex-col justify-center gap-6 pb-10 pt-24 sm:pb-14 sm:pt-28 lg:pb-16 lg:pt-32 lg:pr-10">
          <Link href="/empresas" className="text-[13px] font-medium text-muted transition hover:text-foreground">
            ← {tPage("backToDirectory")}
          </Link>
          <div className="flex flex-wrap items-center gap-4">
            <BusinessAvatar business={business} className="h-16 w-16 rounded-md bg-white shadow-sm ring-1 ring-black/5" textClassName="text-[20px] font-semibold text-primary" />
            <p className="text-[15px] font-medium uppercase tracking-[0.18em] text-foreground">{business.name}</p>
            {business.verified && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-white px-3 py-1 text-[12px] font-medium text-primary">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {t("verified")}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[14px] text-foreground/75">
            <span className="inline-flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-primary" aria-hidden="true" />
              {tCategories(business.category)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
              {business.floor}
            </span>
            {open !== null && (
              <span className={`inline-flex items-center gap-1.5 font-medium ${open ? "text-whatsapp" : "text-muted"}`}>
                <span className={`h-2 w-2 rounded-full ${open ? "bg-whatsapp" : "bg-muted"}`} aria-hidden="true" />
                {open ? t("openNow") : t("closedNow")}
              </span>
            )}
          </div>
          <h1 className="max-w-xl text-[clamp(2rem,4.4vw,3.25rem)] font-semibold leading-[1.08] tracking-tight text-foreground">
            {config.heroHeadline ?? t("defaultHeadline", { name: business.name })}
          </h1>
          {subtitle && <p className="max-w-lg text-[17px] leading-relaxed text-foreground/75">{subtitle}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <WhatsAppLink href={ctx.whatsappHref} businessId={business.id} businessName={business.name} className={WHATSAPP_BUTTON}>
              {t("whatsappCta")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </WhatsAppLink>
            {secondary.external ? (
              <a href={secondary.href} target="_blank" rel="noopener noreferrer" className={OUTLINE_BUTTON}>
                {secondary.label}
              </a>
            ) : (
              <a href={secondary.href} className={OUTLINE_BUTTON}>
                {secondary.label}
              </a>
            )}
            <FavoriteButton businessId={business.id} />
          </div>
        </div>
        <HeroImage ctx={ctx} />
      </div>
    </section>
  );
}
