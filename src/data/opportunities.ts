export type OpportunityType = "procura" | "oferece" | "contratando" | "parceria";

export type Opportunity = {
  id: string;
  businessId: string;
  type: OpportunityType;
  title: string;
  description: string;
};

export const opportunityTypeLabels: Record<OpportunityType, string> = {
  procura: "Procura",
  oferece: "Oferece",
  contratando: "Contratando",
  parceria: "Parceria",
};

export const opportunities: Opportunity[] = [
  {
    id: "viva-fotografo",
    businessId: "clinica-viva",
    type: "procura",
    title: "Procura um fotógrafo para o Instagram",
    description:
      "A Clínica Viva quer renovar o conteúdo das redes sociais e procura alguém do prédio pra fotografar o consultório e a equipe.",
  },
  {
    id: "nonna-beneficio",
    businessId: "cantina-nonna",
    type: "oferece",
    title: "Desconto pra empresas do prédio",
    description:
      "A Cantina da Nonna oferece 15% de desconto no almoço executivo pra quem fecha pedido em grupo com outra empresa do Cerâmica.",
  },
  {
    id: "reis-tech",
    businessId: "advocacia-reis",
    type: "parceria",
    title: "Busca parceiro de tecnologia",
    description:
      "A Reis & Andrade quer digitalizar a gestão de contratos e procura uma empresa de tecnologia do prédio pra tocar o projeto junto.",
  },
  {
    id: "geez-estagio",
    businessId: "geez-publicidade",
    type: "contratando",
    title: "Contratando estágio em design",
    description: "A Geez Publicidade está com vaga aberta de estágio em design pra quem já circula pelo Cerâmica.",
  },
  {
    id: "derme-fornecedor",
    businessId: "espaco-derme",
    type: "procura",
    title: "Procura fornecedor de skincare",
    description:
      "O Espaço Derme está buscando um novo fornecedor de produtos de skincare profissional — de preferência alguém que já atenda o prédio.",
  },
  {
    id: "barbearia-acao",
    businessId: "barbearia-bloco",
    type: "parceria",
    title: "Busca empresas para ação conjunta",
    description:
      "A Barbearia do Bloco quer organizar uma ação de Dia dos Pais com outras empresas do prédio — procura quem topa entrar.",
  },
];
