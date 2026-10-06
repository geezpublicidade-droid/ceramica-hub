export const LEAD_STATUSES = ["novo", "em_atendimento", "contatado", "proposta_enviada", "convertido", "perdido"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  novo: "Novo",
  em_atendimento: "Em atendimento",
  contatado: "Contatado",
  proposta_enviada: "Proposta enviada",
  convertido: "Convertido",
  perdido: "Perdido",
};
