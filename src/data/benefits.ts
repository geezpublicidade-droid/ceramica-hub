export type BenefitKind = "desconto" | "cortesia" | "combo" | "avaliacao-gratis" | "beneficio-funcionario" | "promocao";

export type Benefit = {
  id: string;
  businessId: string;
  kind: BenefitKind;
  title: string;
  description: string;
  validUntil?: string;
  couponCode?: string;
};
