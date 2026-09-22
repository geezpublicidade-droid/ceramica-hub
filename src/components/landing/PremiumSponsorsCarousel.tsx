import { getTranslations } from "next-intl/server";
import { SqueezeCarousel, type SqueezeSlide } from "@/components/ui/carousel-squeeze";
import type { InstitutionalPartner } from "@/lib/services/institutional-partners";

type PremiumSponsorsCarouselProps = {
  partners: InstitutionalPartner[];
};

const mark = (text: string) => <span className="text-sm font-medium tracking-tight text-white">{text}</span>;

/** "Patrocinadores Premium" logo abaixo dos botões do hero -- com patrocinador
 * real cadastrado (institutional_partners, status "ativo"), mostra eles.
 * Sem nenhum ainda (caso de hoje), cai em slides promocionais que reusam
 * texto real já existente no site (plano Patrocinador em Pricing.tsx,
 * AdvertisersCTA) -- nunca inventa marca ou depoimento fictício. */
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
    <div className="mt-[28px] max-w-2xl">
      <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-white/70">{t("eyebrow")}</p>
      <div className="mt-3">
        <SqueezeCarousel
          slides={slides}
          height={140}
          radius={8}
          label={t("headline")}
          accent="var(--primary)"
          accentForeground="#fff"
        />
      </div>
    </div>
  );
}
