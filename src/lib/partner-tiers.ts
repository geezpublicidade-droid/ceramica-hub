/** Níveis de parceiro institucional -- constantes puras (seguras pra client components). */
export const PARTNER_TIERS = ["ancora_fundadora", "parceiro_premium", "presenca_institucional", "parceiro_ecossistema"] as const;
export type PartnerTier = (typeof PARTNER_TIERS)[number];

/** Ordem de exibição: âncoras fundadoras primeiro, depois premium, etc. */
export const PARTNER_TIER_RANK: Record<PartnerTier, number> = {
  ancora_fundadora: 0,
  parceiro_premium: 1,
  presenca_institucional: 2,
  parceiro_ecossistema: 3,
};

export const PARTNER_TIER_LABEL: Record<PartnerTier, string> = {
  ancora_fundadora: "Âncora Fundadora",
  parceiro_premium: "Parceiro Premium",
  presenca_institucional: "Presença Institucional na Home",
  parceiro_ecossistema: "Parceiro do Ecossistema",
};

/** Cotas iniciais de Âncora Fundadora. */
export const FOUNDER_QUOTA = 7;

/** Só estes níveis entram na faixa de logos e no bloco "Parceiros Fundadores" da home -- Parceiro do Ecossistema não, pra não parecer instalado/âncora. */
export const HOME_TIERS: readonly PartnerTier[] = ["ancora_fundadora", "parceiro_premium", "presenca_institucional"];
