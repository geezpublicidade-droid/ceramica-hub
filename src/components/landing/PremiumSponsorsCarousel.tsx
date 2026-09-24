import { getTranslations } from "next-intl/server";
import { SqueezeCarousel, type SqueezeSlide } from "@/components/ui/carousel-squeeze";
import type { InstitutionalPartner } from "@/lib/services/institutional-partners";

type PremiumSponsorsCarouselProps = {
  partners: InstitutionalPartner[];
};

const mark = (text: string) => <span className="text-[18px] font-medium tracking-tight text-white sm:text-xl">{text}</span>;

/** "Patrocinadores Premium" -- seção própria logo abaixo do hero. Com
 * patrocinador real cadastrado (institutional_partners, status "ativo"),
 * mostra eles. Sem nenhum ainda (caso de hoje), cai em slides promocionais
 * que reusam texto real já existente no site (plano Patrocinador em
 * Pricing.tsx, AdvertisersCTA) -- nunca inventa marca ou depoimento fictício. */
export async function PremiumSponsorsCarousel({ partners }: PremiumSponsorsCarouselProps) {
  const [t, tPricing, tAds] = await Promise.all([
    getTranslations("PremiumSponsors"),
    getTranslations("Pricing"),
    getTranslations("AdvertisersCTA"),
  ]);

  const slides: SqueezeSlide[] =
    partners.length > 0
      ? partners.map((partner) => ({
          id: partner.id,
          title: partner.name,
          description: t("partnerBadge"),
          image: partner.logoUrl ?? "/images/ceramica-hub-corporativo.webp",
          imageAlt: partner.name,
          overlay: mark(partner.name),
          action: partner.link ? t("ctaAction") : undefined,
          href: partner.link ?? undefined,
          target: partner.link ? "_blank" : undefined,
        }))
      : [
          {
            id: "patrocinador",
            title: tPricing("plans.patrocinador.name"),
            description: tPricing("plans.patrocinador.description"),
            image: "/images/ceramica-hub-hero.webp",
            overlay: mark(tPricing("plans.patrocinador.name")),
            action: t("ctaAction"),
            href: "/seja-um-parceiro",
          },
          {
            id: "ativacoes",
            title: t("slide2Title"),
            description: t("slide2Description"),
            image: "/images/ceramica-hub-corporativo.webp",
            overlay: mark(tAds("eyebrow")),
            action: t("ctaAction"),
            href: "/seja-um-parceiro",
          },
          {
            id: "proposta",
            title: t("slide3Title"),
            description: t("slide3Description"),
            image: "/images/ceramica-hub-eventos.webp",
            overlay: mark(tAds("eyebrow")),
            action: t("ctaAction"),
            href: "/seja-um-parceiro",
          },
        ];

  return (
    <section className="section-pad-y bg-white">
      <div className="container-page">
        <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-primary">{t("eyebrow")}</p>
        <h2 className="mt-3 text-[clamp(1.8rem,3.2vw,2.5rem)] font-semibold leading-tight tracking-tight text-foreground">
          {t("headline")}
        </h2>
        <div className="mt-8">
          <SqueezeCarousel
            slides={slides}
            height="clamp(420px, 46vw, 640px)"
            radius={12}
            label={t("headline")}
            accent="var(--primary)"
            accentForeground="#fff"
          />
        </div>
      </div>
    </section>
  );
}
