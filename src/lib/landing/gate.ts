import type { LandingConfig } from "@/lib/services/landing";
import type { LandingCapabilities } from "./sections.ts";

/**
 * Aplica o plano em vigor à configuração SALVA da landing: o que o plano não inclui é escondido (nada é apagado do banco),
 * e volta a aparecer sozinho se o plano superior for reativado. Os valores padrão são os de uma landing vazia.
 */
export function gateLandingConfig(config: LandingConfig, capabilities: LandingCapabilities): LandingConfig {
  const next = { ...config };

  if (!capabilities.customCover) {
    next.heroHeadline = null;
    next.heroSubtitle = null;
    next.heroImageUrl = null;
    next.heroCtaKind = "servicos";
    next.heroCtaLabel = null;
  }
  if (!capabilities.customSections) {
    next.aboutProblem = null;
    next.aboutBenefit = null;
    next.aboutDifferentials = [];
    next.aboutAudience = null;
    next.yearsInBusiness = null;
    next.responseTime = null;
    next.byAppointment = false;
    next.professionalRegistry = null;
    next.sectionOrder = [];
    next.sectionsDisabled = [];
    next.seoTitle = null;
    next.seoDescription = null;
  }
  if (!capabilities.customCta) {
    next.whatsappMessage = null;
    next.finalCtaTitle = null;
    next.finalCtaText = null;
    next.finalCtaLabel = null;
  }
  if (!capabilities.leadForm) next.leadFormEnabled = false;
  if (!capabilities.whatsapp) next.whatsappPhone = null;
  if (!capabilities.socialMedia) {
    next.facebookUrl = null;
    next.tiktokUrl = null;
    next.youtubeUrl = null;
  }
  if (!capabilities.businessHours) next.openingSchedule = null;
  if (!capabilities.commercialInfo) {
    next.parkingInfo = null;
    next.accessibilityInfo = null;
    next.referencePoint = null;
  }
  return next;
}
