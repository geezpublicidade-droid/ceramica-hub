/** Catálogo das regras operacionais (Fase 4.4). Constantes puras: alimentam o executor e a tela do admin. */

export const OPERATIONAL_RULES = [
  "lead_followup",
  "proposal_expiring",
  "proposal_expired",
  "overdue_payment",
  "inactive_business",
  "subscription_expired",
] as const;
export type OperationalRule = (typeof OPERATIONAL_RULES)[number];

export type OperationalRuleMeta = {
  label: string;
  description: string;
  /** "task" cria tarefa para a equipe; "state" muda o estado do sistema sozinha. */
  effect: "task" | "state";
};

export const OPERATIONAL_RULE_META: Record<OperationalRule, OperationalRuleMeta> = {
  lead_followup: {
    label: "Lead novo vira tarefa",
    description: "Lead ainda no estágio Novo (últimos 14 dias) gera a tarefa de primeiro contato, com prazo de 1 dia.",
    effect: "task",
  },
  proposal_expiring: {
    label: "Proposta vencendo",
    description: "Proposta enviada, visualizada ou em negociação que vence em até 3 dias gera tarefa para o comercial.",
    effect: "task",
  },
  proposal_expired: {
    label: "Proposta vencida",
    description: "Proposta em aberto com a validade ultrapassada passa sozinha para o status Vencida.",
    effect: "state",
  },
  overdue_payment: {
    label: "Pagamento atrasado",
    description: "Assinatura em atraso gera tarefa urgente de cobrança para o financeiro.",
    effect: "task",
  },
  inactive_business: {
    label: "Empresa sem atividade",
    description: "Empresa aprovada há mais de 30 dias sem nenhuma visita à sua página gera tarefa para reativar a divulgação.",
    effect: "task",
  },
  subscription_expired: {
    label: "Contrato terminou: benefícios bloqueados",
    description:
      "Assinatura com prazo vencido passa a Expirada e a empresa volta ao plano Presença, desde que não tenha outra assinatura ativa. Campanhas de publicidade já encerram sozinhas pela data.",
    effect: "state",
  },
};
