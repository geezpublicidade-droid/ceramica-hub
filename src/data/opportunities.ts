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
