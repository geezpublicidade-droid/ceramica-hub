/** Catálogo das automações (Fase 3.7). Constantes puras: alimentam o motor, as regras e a tela do admin. */

export const AUTOMATION_KEYS = [
  "welcome",
  "incomplete_profile",
  "approval_request",
  "publication_reminder",
  "monthly_report",
  "campaign_ended",
  "renewal",
  "reactivation",
  "new_lead",
] as const;
export type AutomationKey = (typeof AUTOMATION_KEYS)[number];

export type AutomationMeta = {
  label: string;
  description: string;
  /** Quem recebe: a empresa (business) ou a equipe (admin). */
  audience: "business" | "admin";
  /** Só envia a quem tem consentimento de marketing ativo (LGPD). */
  requiresConsent: boolean;
};

export const AUTOMATIONS: Record<AutomationKey, AutomationMeta> = {
  welcome: {
    label: "Boas-vindas",
    description: "Empresa aprovada nos últimos 14 dias recebe um e-mail de boas-vindas com os primeiros passos.",
    audience: "business",
    requiresConsent: false,
  },
  incomplete_profile: {
    label: "Cadastro incompleto",
    description: "Empresa cadastrada há 3 a 30 dias sem logo ou descrição é lembrada de completar a página.",
    audience: "business",
    requiresConsent: false,
  },
  approval_request: {
    label: "Pedido de aprovação",
    description: "Resumo diário, para a equipe, de conteúdos e campanhas aguardando aprovação.",
    audience: "admin",
    requiresConsent: false,
  },
  publication_reminder: {
    label: "Lembrete de publicação",
    description: "Avisa o responsável quando um conteúdo aprovado ou agendado vai ao ar hoje ou amanhã.",
    audience: "admin",
    requiresConsent: false,
  },
  monthly_report: {
    label: "Relatório mensal",
    description: "Nos primeiros dias do mês, empresas de planos pagos com consentimento recebem o resumo do mês anterior.",
    audience: "business",
    requiresConsent: true,
  },
  campaign_ended: {
    label: "Campanha encerrada",
    description: "Campanhas ativas com prazo vencido passam a Encerrada e o responsável recebe o aviso para ver os resultados.",
    audience: "admin",
    requiresConsent: false,
  },
  renewal: {
    label: "Renovação",
    description: "Avisa a empresa sobre plano ou teste gratuito perto do fim, e a equipe sobre contratos de âncora vencendo.",
    audience: "business",
    requiresConsent: false,
  },
  reactivation: {
    label: "Reativação",
    description: "Empresa cujo teste ou plano terminou há 7 a 60 dias (e com consentimento) recebe um convite para voltar.",
    audience: "business",
    requiresConsent: true,
  },
  new_lead: {
    label: "Novo lead",
    description: "A equipe comercial é avisada de cada lead novo (CRM e formulário de parceiros).",
    audience: "admin",
    requiresConsent: false,
  },
};
