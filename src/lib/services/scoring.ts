import type { Lead, LeadSource, LeadStage } from "@/lib/services/leads";

/** Pontuação de leads e clientes (Fase 4.5). Funções puras: sem banco, sem relógio implícito. */

const DAY_MS = 24 * 60 * 60 * 1000;
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export type LeadBand = "quente" | "morno" | "frio";

export type LeadScore = {
  score: number;
  band: LeadBand;
  /** Estimativa heurística (a pontuação lida como %), não uma previsão estatística. */
  closeProbability: number;
  daysSinceContact: number;
  reasons: string[];
};

export type LeadScoreContext = { openProposals: number; proposalViewed: boolean };

const STAGE_POINTS: Partial<Record<LeadStage, number>> = {
  novo: 10,
  primeiro_contato: 20,
  qualificacao: 35,
  reuniao_agendada: 50,
  proposta_enviada: 65,
  negociacao: 80,
};

const STRONG_SOURCES: LeadSource[] = ["indicacao", "parceiro", "evento"];

type Factor = { points: number; reason: string | null };

const stageFactor = (stage: LeadStage): Factor => ({ points: STAGE_POINTS[stage] ?? 0, reason: null });

function valueFactor(cents: number | null): Factor {
  if (!cents) return { points: 0, reason: null };
  if (cents >= 500_000) return { points: 15, reason: "Alto valor potencial" };
  if (cents >= 100_000) return { points: 10, reason: "Bom valor potencial" };
  return { points: 5, reason: null };
}

function recencyFactor(daysSinceContact: number): Factor {
  if (daysSinceContact <= 3) return { points: 15, reason: "Contato recente" };
  if (daysSinceContact <= 7) return { points: 10, reason: null };
  if (daysSinceContact <= 14) return { points: 5, reason: null };
  if (daysSinceContact > 30) return { points: -15, reason: `Sem contato há ${daysSinceContact} dias` };
  return { points: 0, reason: null };
}

function proposalFactor(context: LeadScoreContext): Factor {
  if (context.openProposals === 0) return { points: 0, reason: null };
  if (context.proposalViewed) return { points: 15, reason: "Proposta aberta e já visualizada" };
  return { points: 10, reason: "Proposta em aberto" };
}

function qualityFactor(lead: Lead): Factor {
  const points = (STRONG_SOURCES.includes(lead.source) ? 5 : 0) + (lead.email && (lead.phone || lead.whatsapp) ? 5 : 0);
  return { points, reason: STRONG_SOURCES.includes(lead.source) ? "Origem de alta confiança" : null };
}

function overdueFactor(lead: Lead, now: Date): Factor {
  const overdue = lead.nextActionAt && new Date(lead.nextActionAt) < now;
  return overdue ? { points: -5, reason: "Próxima ação atrasada" } : { points: 0, reason: null };
}

export function leadBand(score: number): LeadBand {
  if (score >= 70) return "quente";
  if (score >= 40) return "morno";
  return "frio";
}

export function scoreLead(lead: Lead, context: LeadScoreContext, now = new Date()): LeadScore {
  const lastContact = new Date(lead.lastContactAt ?? lead.createdAt);
  const daysSinceContact = Math.max(0, Math.floor((now.getTime() - lastContact.getTime()) / DAY_MS));
  const factors = [
    stageFactor(lead.stage),
    valueFactor(lead.estimatedValueCents),
    recencyFactor(daysSinceContact),
    proposalFactor(context),
    qualityFactor(lead),
    overdueFactor(lead, now),
  ];
  const score = clamp(factors.reduce((sum, factor) => sum + factor.points, 0));
  return {
    score,
    band: leadBand(score),
    closeProbability: score,
    daysSinceContact,
    reasons: factors.flatMap((factor) => (factor.reason ? [factor.reason] : [])),
  };
}

export type CustomerBand = "saudavel" | "atencao" | "risco";

export const CUSTOMER_BAND_LABEL: Record<CustomerBand, string> = {
  saudavel: "Cliente saudável",
  atencao: "Requer atenção",
  risco: "Risco de cancelamento",
};

export type CustomerHealthInput = {
  pastDue: boolean;
  /** Dias até o fim do contrato pago; null quando não há contrato com prazo. */
  daysToContractEnd: number | null;
  ageDays: number;
  views: number;
  prevViews: number;
  clicks: number;
  profileComplete: boolean;
};

export type CustomerHealth = { score: number; band: CustomerBand; reasons: string[] };

function engagementFactor(input: CustomerHealthInput): Factor {
  if (input.views === 0 && input.ageDays > 30) return { points: -25, reason: "Nenhuma visita nos últimos 30 dias" };
  if (input.prevViews === 0) return { points: 0, reason: null };
  const change = (input.views - input.prevViews) / input.prevViews;
  if (change <= -0.4) return { points: -15, reason: "Visitas caíram mais de 40%" };
  if (change <= -0.2) return { points: -8, reason: "Visitas em queda" };
  if (change >= 0.2) return { points: 10, reason: "Visitas em alta" };
  return { points: 0, reason: null };
}

function contractFactor(input: CustomerHealthInput): Factor {
  if (input.pastDue) return { points: -40, reason: "Pagamento em atraso" };
  const days = input.daysToContractEnd;
  if (days !== null && days <= 15) return { points: -10, reason: `Contrato termina em ${Math.max(days, 0)} dia(s)` };
  return { points: 0, reason: null };
}

export function scoreCustomer(input: CustomerHealthInput): CustomerHealth {
  const factors: Factor[] = [
    contractFactor(input),
    engagementFactor(input),
    input.clicks > 0 ? { points: 10, reason: "Gera contatos" } : { points: 0, reason: null },
    input.profileComplete ? { points: 0, reason: null } : { points: -10, reason: "Perfil incompleto" },
  ];
  const score = clamp(70 + factors.reduce((sum, factor) => sum + factor.points, 0));
  const band: CustomerBand = input.pastDue || score < 40 ? "risco" : score < 65 ? "atencao" : "saudavel";
  return { score, band, reasons: factors.flatMap((factor) => (factor.reason ? [factor.reason] : [])) };
}
