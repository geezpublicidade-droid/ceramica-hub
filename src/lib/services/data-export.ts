import { createServiceClient } from "@/lib/supabase/server";

/** Exportação de dados (Fase 4.8): cópia manual para backup e portabilidade. Só tabelas da lista, nunca colunas sensíveis. */

export const EXPORT_TABLES = [
  "businesses",
  "leads",
  "proposals",
  "tasks",
  "subscriptions",
  "invoices",
  "business_goals",
  "email_consents",
  "ad_campaigns",
  "audit_logs",
] as const;
export type ExportTable = (typeof EXPORT_TABLES)[number];
export type ExportFormat = "csv" | "json";

export const EXPORT_TABLE_LABEL: Record<ExportTable, string> = {
  businesses: "Empresas",
  leads: "Leads",
  proposals: "Propostas",
  tasks: "Tarefas",
  subscriptions: "Assinaturas",
  invoices: "Faturas",
  business_goals: "Metas",
  email_consents: "Consentimentos de e-mail (LGPD)",
  ad_campaigns: "Campanhas de publicidade",
  audit_logs: "Histórico de auditoria",
};

const PAGE_SIZE = 1000;
const MAX_PAGES = 100;
/** Coluna usada pra ordenar; nem toda tabela tem `created_at`. */
const ORDER_COLUMN: Partial<Record<ExportTable, string>> = { business_goals: "updated_at", email_consents: "granted_at" };
/** Hash de senha, segredos de MFA, tokens e chaves nunca saem em exportação. */
const SENSITIVE_COLUMN = /password|secret|token|hash|mfa|api_key/i;

export function isExportTable(value: string): value is ExportTable {
  return (EXPORT_TABLES as readonly string[]).includes(value);
}

export function isExportFormat(value: string | null): value is ExportFormat {
  return value === "csv" || value === "json";
}

type Row = Record<string, unknown>;

function stripSensitive(row: Row): Row {
  return Object.fromEntries(Object.entries(row).filter(([key]) => !SENSITIVE_COLUMN.test(key)));
}

export async function fetchTableRows(table: ExportTable): Promise<Row[]> {
  const supabase = createServiceClient();
  const rows: Row[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order(ORDER_COLUMN[table] ?? "created_at", { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []).map(stripSensitive));
    if ((data?.length ?? 0) < PAGE_SIZE) return rows;
  }
  throw new Error(`Exportação de ${table} passou do limite de ${MAX_PAGES * PAGE_SIZE} linhas.`);
}

/** Evita injeção de fórmula ao abrir no Excel/Sheets: células que começam com = + - @ ganham um apóstrofo. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: Row[]): string {
  const columnSet = new Set<string>();
  for (const row of rows) for (const key of Object.keys(row)) columnSet.add(key);
  const columns = [...columnSet];
  const lines = rows.map((row) => columns.map((column) => csvCell(row[column])).join(","));
  return [columns.join(","), ...lines].join("\r\n");
}
