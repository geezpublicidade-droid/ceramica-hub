export type BenefitKind = "desconto" | "cortesia" | "combo" | "avaliacao-gratis" | "beneficio-funcionario";

export type Benefit = {
  id: string;
  businessId: string;
  kind: BenefitKind;
  title: string;
  description: string;
  validUntil?: string;
  couponCode?: string;
};

export const benefitKindLabels: Record<BenefitKind, string> = {
  desconto: "Desconto",
  cortesia: "Cortesia",
  combo: "Combo",
  "avaliacao-gratis": "Avaliação grátis",
  "beneficio-funcionario": "Para funcionários",
};
