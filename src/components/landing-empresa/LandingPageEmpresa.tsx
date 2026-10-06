import type { ReactElement } from "react";
import type { SectionKey } from "@/lib/landing/sections";
import { AboutSection } from "./AboutSection";
import type { LandingContext } from "./context";
import { FaqSection } from "./FaqSection";
import { FinalCta } from "./FinalCta";
import { FloatingActions } from "./FloatingActions";
import { GallerySection } from "./GallerySection";
import { Hero } from "./Hero";
import { LocationSection } from "./LocationSection";
import { OfferSection } from "./OfferSection";
import { ReviewsStrip } from "./ReviewsStrip";
import { ServicesSection } from "./ServicesSection";
import { TrustBar } from "./TrustBar";

const SECTIONS: Record<SectionKey, (props: { ctx: LandingContext }) => Promise<ReactElement | null>> = {
  about: AboutSection,
  services: ServicesSection,
  offer: OfferSection,
  gallery: GallerySection,
  reviews: ReviewsStrip,
  location: LocationSection,
  faq: FaqSection,
  cta: FinalCta,
};

/**
 * Landing page de uma empresa: hero, barra de confiança e as seções na ordem configurada
 * (padrão: sobre, serviços, oferta, galeria, avaliações, localização, FAQ, CTA final).
 * Alimentada só por dados cadastrados; seção sem conteúdo ou desativada simplesmente não aparece.
 */
export async function LandingPageEmpresa({ ctx, children }: { ctx: LandingContext; children?: React.ReactNode }) {
  return (
    <div className="bg-[#fbf9f6] pb-16 md:pb-0">
      <Hero ctx={ctx} />
      <TrustBar ctx={ctx} />
      {ctx.data.sections.map((key) => {
        const Section = SECTIONS[key];
        return <Section key={key} ctx={ctx} />;
      })}
      {children}
      <FloatingActions ctx={ctx} />
    </div>
  );
}
