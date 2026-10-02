import { createServiceClient } from "@/lib/supabase/server";
import { formatCents } from "@/lib/utils";
import { getExecutiveDashboard } from "@/lib/services/executive-dashboard";
import { GOALS, goalProgress, percentChange, type GoalMetric } from "@/lib/services/executive-goals";
import { getPortalAnalytics } from "@/lib/services/portal-analytics";
import { getScoredLeads } from "@/lib/services/scoring-data";
import { escapeHtml } from "@/lib/services/email-marketing";

/** Relatórios automáticos (Fase 4.3). Um construtor só: o mesmo conteúdo vai pro e-mail e pra tela do admin. */

const DAY_MS = 24 * 60 * 60 * 1000;
const PORTAL_WINDOW_DAYS = 30;

export type ReportLine = { label: string; value: string };
export type ReportSection = { title: string; lines: ReportLine[] };
export type Report = { title: string; subtitle: string; sections: ReportSection[] };

export function monthLabel(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  return new Date(Date.UTC(year, mon - 1, 1)).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
}

function versus(current: number, previous: number): string {
  const change = percentChange(current, previous);
  return change === null ? "sem base de comparação" : `${change > 0 ? "+" : ""}${change}% vs mês anterior`;
}

function formatGoal(metric: GoalMetric, value: number): string {
  const unit = GOALS[metric].unit;
  if (unit === "money") return formatCents(Math.round(value));
  return unit === "percent" ? `${Math.round(value)}%` : String(Math.round(value));
}

function goalLine(metric: GoalMetric, actual: number, target: number | null): ReportLine {
  if (target === null) return { label: GOALS[metric].label, value: `${formatGoal(metric, actual)} (sem meta definida)` };
  const progress = goalProgress(actual, target);
  return { label: GOALS[metric].label, value: `${formatGoal(metric, actual)} de ${formatGoal(metric, target)} (${progress ?? 0}%)` };
}

export async function buildExecutiveReport(month: string): Promise<Report> {
  const [data, portal] = await Promise.all([getExecutiveDashboard(month), getPortalAnalytics(PORTAL_WINDOW_DAYS)]);
  const { current, previous } = data;
  const contacts = portal.clicks.whatsapp + portal.clicks.phone + portal.clicks.website + portal.clicks.directions;
  const unmet = portal.noResultSearches.slice(0, 3).map((item) => `${item.label} (${item.total})`);

  return {
    title: `Relatório executivo de ${monthLabel(month)}`,
    subtitle: "Receita, contratos, metas e audiência do Cerâmica Hub.",
    sections: [
      {
        title: "Receita",
        lines: [
          { label: "Receita do mês", value: `${formatCents(current.revenueCents)} (${versus(current.revenueCents, previous.revenueCents)})` },
          { label: "Receita recorrente mensal", value: formatCents(data.mrrCents) },
          { label: "Ticket médio", value: formatCents(current.ticketCents) },
        ],
      },
      {
        title: "Contratos e empresas",
        lines: [
          { label: "Empresas ativas", value: String(data.activeBusinesses) },
          { label: "Novos contratos", value: `${current.newContracts} (${versus(current.newContracts, previous.newContracts)})` },
          { label: "Cancelamentos e expirações", value: String(current.churned) },
          { label: "Taxa de renovação", value: current.renewalRate === null ? "sem contratos vencendo" : `${current.renewalRate}%` },
          { label: "Inadimplência", value: `${data.delinquentCount} assinatura(s), ${formatCents(data.delinquentCents)}/mês em atraso` },
          { label: "Espaços publicitários vendidos", value: `${data.adOccupancy.sold} de ${data.adOccupancy.capacity} (${data.adOccupancy.percent}%)` },
        ],
      },
      { title: "Metas do mês", lines: data.goals.map((goal) => goalLine(goal.metric, goal.actual, goal.target)) },
      {
        title: `Audiência (últimos ${PORTAL_WINDOW_DAYS} dias)`,
        lines: [
          { label: "Visitas ao portal", value: String(portal.visits) },
          { label: "Cliques de contato", value: String(contacts) },
          { label: "Buscas sem resultado", value: unmet.length > 0 ? unmet.join(", ") : "nenhuma" },
        ],
      },
    ],
  };
}

async function countSince(table: "leads" | "proposals", column: string, since: string, extra?: { stage?: string; status?: string[] }): Promise<number> {
  let query = createServiceClient().from(table).select("id", { count: "exact", head: true }).gte(column, since);
  if (extra?.stage) query = query.eq("stage", extra.stage);
  if (extra?.status) query = query.in("status", extra.status);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function buildSalesReport(now = new Date()): Promise<Report> {
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS).toISOString();
  const [scored, newLeads, won, sent] = await Promise.all([
    getScoredLeads(),
    countSince("leads", "created_at", weekAgo),
    countSince("leads", "updated_at", weekAgo, { stage: "fechado" }),
    countSince("proposals", "sent_at", weekAgo),
  ]);
  const hot = scored.filter((item) => item.score.band === "quente");
  const stale = scored.filter((item) => item.score.daysSinceContact > 7);

  return {
    title: "Relatório da equipe comercial",
    subtitle: "Resumo da semana: funil, leads quentes e propostas.",
    sections: [
      {
        title: "Semana",
        lines: [
          { label: "Novos leads", value: String(newLeads) },
          { label: "Leads fechados", value: String(won) },
          { label: "Propostas enviadas", value: String(sent) },
        ],
      },
      {
        title: "Funil agora",
        lines: [
          { label: "Leads em andamento", value: String(scored.length) },
          { label: "Leads quentes", value: hot.length > 0 ? hot.slice(0, 5).map((item) => `${item.lead.contactName} (${item.score.score})`).join(", ") : "nenhum" },
          { label: "Sem contato há mais de 7 dias", value: stale.length > 0 ? stale.slice(0, 5).map((item) => `${item.lead.contactName} (${item.score.daysSinceContact}d)`).join(", ") : "nenhum" },
        ],
      },
    ],
  };
}

/** HTML do corpo do e-mail (tabela simples, valores escapados). */
export function renderReportBody(report: Report): string {
  const sections = report.sections.map((section) => {
    const rows = section.lines
      .map((line) => `<tr><td style="padding:4px 12px 4px 0;color:#7a746c">${escapeHtml(line.label)}</td><td style="padding:4px 0"><strong>${escapeHtml(line.value)}</strong></td></tr>`)
      .join("");
    return `<h3 style="font-size:16px;margin:20px 0 6px">${escapeHtml(section.title)}</h3><table style="font-size:14px;border-collapse:collapse">${rows}</table>`;
  });
  return `<p>${escapeHtml(report.subtitle)}</p>${sections.join("")}`;
}
