export type BenefitKind = "desconto" | "cortesia" | "combo" | "avaliacao-gratis" | "beneficio-funcionario";

export type Benefit = {
  id: string;
  businessId: string;
  kind: BenefitKind;
  title: string;
  description: string;
};

export const benefitKindLabels: Record<BenefitKind, string> = {
  desconto: "Desconto",
  cortesia: "Cortesia",
  combo: "Combo",
  "avaliacao-gratis": "Avaliação grátis",
  "beneficio-funcionario": "Para funcionários",
};

export const benefits: Benefit[] = [
  {
    id: "conta-certa-indicacao",
    businessId: "conta-certa",
    kind: "desconto",
    title: "20% na abertura de empresa",
    description: "Pra quem indicar outra empresa do prédio na Conta Certa Contabilidade.",
  },
  {
    id: "derme-avaliacao",
    businessId: "espaco-derme",
    kind: "avaliacao-gratis",
    title: "Avaliação facial gratuita",
    description: "O Espaço Derme oferece uma avaliação facial sem custo pra empresas do Cerâmica.",
  },
  {
    id: "nonna-combo",
    businessId: "cantina-nonna",
    kind: "combo",
    title: "Combo executivo em grupo",
    description: "Desconto progressivo na Cantina da Nonna pra pedidos de 3 ou mais pessoas do mesmo andar.",
  },
  {
    id: "barbearia-aniversario",
    businessId: "barbearia-bloco",
    kind: "cortesia",
    title: "Alinhamento de cortesia",
    description: "Barbearia do Bloco oferece um alinhamento de barba de cortesia no mês de aniversário da sua empresa.",
  },
  {
    id: "nuvem-visita",
    businessId: "nuvem-tech",
    kind: "cortesia",
    title: "Primeira visita técnica grátis",
    description: "Nuvem Tech Suporte não cobra a primeira visita de diagnóstico pra empresas novas no prédio.",
  },
  {
    id: "cafe-fidelidade",
    businessId: "cafe-do-predio",
    kind: "beneficio-funcionario",
    title: "Fidelidade entre empresas",
    description: "Café do Prédio aceita um cartão fidelidade único, compartilhado entre os funcionários de qualquer empresa do Cerâmica.",
  },
];
