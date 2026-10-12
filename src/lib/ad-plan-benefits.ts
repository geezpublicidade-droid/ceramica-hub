/** Benefícios de cada plano na loja de divulgação. Valores iniciais definidos pelo Hub; ajuste aqui quando o comercial decidir. */
export const AD_DISCOUNT_PERCENT: Record<string, number> = {
  presenca: 0,
  profissional: 0,
  destaque: 10,
  experiencia: 15,
  premium: 20,
};

/** Publicações incluídas por mês no plano (por produto); passou disso, paga o preço cheio (com desconto do plano). */
export const PUBLICATION_ALLOWANCE: Record<string, Record<string, number>> = {
  story_hub: { destaque: 4, experiencia: 8, premium: 12 },
  newsletter_destaque: { premium: 1 },
  editorial_materia: { premium: 1 },
};

export function discountFor(plan: string): number {
  return AD_DISCOUNT_PERCENT[plan] ?? 0;
}

export function applyDiscount(cents: number, percent: number): number {
  return Math.max(0, Math.round(cents * (100 - percent) / 100));
}

/** Quantas publicações do produto ainda cabem no benefício do mês. */
export function remainingAllowance(plan: string, productKey: string, usedThisMonth: number): number {
  const total = PUBLICATION_ALLOWANCE[productKey]?.[plan] ?? 0;
  return Math.max(0, total - usedThisMonth);
}
