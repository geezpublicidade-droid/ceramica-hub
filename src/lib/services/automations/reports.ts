import { previousMonthKey } from "@/lib/services/business-results";
import { buildExecutiveReport, buildSalesReport, renderReportBody } from "@/lib/services/reports";
import { absoluteUrl, renderAutomationEmail } from "./email-layout";
import { adminEmails, adminJobs } from "./helpers";
import type { AutomationJob } from "./types";

const EXECUTIVE_ROLES = ["super_admin", "admin", "financeiro"];
const SALES_ROLES = ["super_admin", "admin", "comercial"];
const MONDAY = 1;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Relatório executivo do mês anterior. Janela de 5 dias: se o envio do dia 1 falhar, os seguintes tentam de novo. */
export async function executiveReportJobs(): Promise<AutomationJob[]> {
  if (new Date().getUTCDate() > 5) return [];
  const month = previousMonthKey();
  const [report, recipients] = await Promise.all([buildExecutiveReport(month), adminEmails(EXECUTIVE_ROLES)]);
  const html = renderAutomationEmail({
    title: report.title,
    bodyHtml: renderReportBody(report),
    cta: { label: "Abrir no painel", href: absoluteUrl(`/admin/relatorios?mes=${month}`) },
  });
  return adminJobs("executive_report", month, recipients, { subject: report.title, html });
}

/** Última segunda-feira (UTC) em formato AAAA-MM-DD: a chave da semana, igual de segunda a domingo. */
function weekKey(now: Date): string {
  const sinceMonday = (now.getUTCDay() + 6) % 7;
  return new Date(now.getTime() - sinceMonday * DAY_MS).toISOString().slice(0, 10);
}

/** Relatório semanal do comercial, enviado na segunda (e na terça, caso a segunda tenha falhado). */
export async function salesReportJobs(): Promise<AutomationJob[]> {
  const now = new Date();
  if (now.getUTCDay() !== MONDAY && now.getUTCDay() !== MONDAY + 1) return [];
  const [report, recipients] = await Promise.all([buildSalesReport(now), adminEmails(SALES_ROLES)]);
  const html = renderAutomationEmail({
    title: report.title,
    bodyHtml: renderReportBody(report),
    cta: { label: "Ver pontuação dos leads", href: absoluteUrl("/admin/pontuacao") },
  });
  return adminJobs("sales_report", weekKey(now), recipients, { subject: report.title, html });
}
