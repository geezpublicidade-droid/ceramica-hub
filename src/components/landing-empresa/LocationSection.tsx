import { Accessibility, Car, Clock, Globe, MapPin, Navigation, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ContactLink } from "@/components/ContactLink";
import { formatSchedule } from "@/lib/landing/hours";
import { OUTLINE_BUTTON, SECTION_TITLE, type LandingContext } from "./context";

function instagramUrl(handle: string) {
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}

type Row = { icon: typeof MapPin; title: string; lines: string[] };

/** Localização e contato: mapa, endereço com torre/andar/sala, horários, estacionamento, acessibilidade, telefone, site e redes. */
export async function LocationSection({ ctx }: { ctx: LandingContext }) {
  const t = await getTranslations("LandingEmpresa");
  const { business, data } = ctx;
  const { config } = data;
  const scheduleLines = formatSchedule(config.openingSchedule);
  const caps = data.capabilities;
  const hours = scheduleLines.length > 0 ? scheduleLines : caps.businessHours && business.openingHours ? [business.openingHours] : [];

  const rows: Row[] = [
    { icon: MapPin, title: t("address"), lines: [business.floor, ctx.address, config.referencePoint].filter((v): v is string => Boolean(v)) },
    { icon: Clock, title: t("hours"), lines: hours },
    { icon: Car, title: t("parkingTitle"), lines: config.parkingInfo ? [config.parkingInfo] : [] },
    { icon: Accessibility, title: t("accessibility"), lines: config.accessibilityInfo ? [config.accessibilityInfo] : [] },
  ].filter((row) => row.lines.length > 0);

  const socials = [
    caps.socialMedia && business.instagram ? { label: "Instagram", href: instagramUrl(business.instagram) } : null,
    config.facebookUrl ? { label: "Facebook", href: config.facebookUrl } : null,
    config.tiktokUrl ? { label: "TikTok", href: config.tiktokUrl } : null,
    config.youtubeUrl ? { label: "YouTube", href: config.youtubeUrl } : null,
  ].filter((item): item is { label: string; href: string } => item !== null);

  return (
    <section id="localizacao" className="container-page py-12 sm:py-16">
      <h2 className={SECTION_TITLE}>{t("locationTitle")}</h2>
      <p className="mt-2 max-w-xl text-[15px] text-foreground/70">{t("locationLead")}</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {ctx.mapEmbedUrl ? (
          <iframe
            src={ctx.mapEmbedUrl}
            title={t("mapTitle")}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-72 w-full rounded-md border border-black/[0.07] lg:h-full lg:min-h-80"
          />
        ) : (
          <div className="h-72 rounded-md bg-surface lg:h-full" aria-hidden="true" />
        )}
        <div className="space-y-5">
          {rows.map(({ icon: Icon, title, lines }) => (
            <div key={title} className="flex gap-3.5">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.7} aria-hidden="true" />
              <div className="text-[14.5px] leading-relaxed">
                <p className="font-semibold text-foreground">{title}</p>
                {lines.map((line) => (
                  <p key={line} className="text-foreground/70">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[14.5px]">
            {ctx.phoneDigits && caps.commercialInfo && (
              <ContactLink href={`tel:${ctx.phoneDigits}`} businessId={business.id} kind="phone" className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary">
                <Phone className="h-4 w-4" aria-hidden="true" />
                {business.phone}
              </ContactLink>
            )}
            {business.websiteUrl && caps.commercialInfo && (
              <ContactLink href={business.websiteUrl} businessId={business.id} kind="website" className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary">
                <Globe className="h-4 w-4" aria-hidden="true" />
                {business.websiteUrl.replace(/^https?:\/\/(www\.)?/, "")}
              </ContactLink>
            )}
            {socials.map((social) => (
              <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:text-primary">
                {social.label}
              </a>
            ))}
          </div>
          {ctx.directionsUrl && (
            <ContactLink href={ctx.directionsUrl} businessId={business.id} kind="directions" className={OUTLINE_BUTTON}>
              <Navigation className="h-4 w-4" aria-hidden="true" />
              {t("directions")}
            </ContactLink>
          )}
        </div>
      </div>
    </section>
  );
}
