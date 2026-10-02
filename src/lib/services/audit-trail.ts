import { createServiceClient } from "@/lib/supabase/server";
import { DELETE_ACTION_SQL_FILTER, EXPORT_ACTION } from "@/lib/audit-actions";
import { getAdminEmailMap } from "@/lib/services/admin-emails";

/** Histórico de alterações, exclusões, exportações e acessos para a tela de auditoria (Fase 4.8). */

export const AUDIT_VIEWS = ["historico", "exclusoes", "exportacoes", "acessos"] as const;
export type AuditView = (typeof AUDIT_VIEWS)[number];

export const AUDIT_VIEW_LABEL: Record<AuditView, string> = {
  historico: "Histórico de alterações",
  exclusoes: "Exclusões",
  exportacoes: "Exportações",
  acessos: "Acessos (logins)",
};

export const AUDIT_PAGE_SIZE = 50;

export function isAuditView(value: string | undefined): value is AuditView {
  return AUDIT_VIEWS.includes(value as AuditView);
}

export type AuditEntry = {
  id: string;
  at: string;
  actorType: string;
  actorLabel: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string;
};

export type AccessEntry = { id: string; at: string; identifier: string; ip: string | null; success: boolean };

type Page<T> = { rows: T[]; total: number };

const summarize = (metadata: unknown): string => {
  if (!metadata) return "";
  const text = JSON.stringify(metadata);
  return text.length > 140 ? `${text.slice(0, 140)}…` : text;
};

export async function getAuditTrail(view: Exclude<AuditView, "acessos">, page: number): Promise<Page<AuditEntry>> {
  let query = createServiceClient()
    .from("audit_logs")
    .select("id, actor_type, actor_id, action, entity_type, entity_id, metadata, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(page * AUDIT_PAGE_SIZE, (page + 1) * AUDIT_PAGE_SIZE - 1);
  if (view === "exclusoes") query = query.or(DELETE_ACTION_SQL_FILTER);
  if (view === "exportacoes") query = query.eq("action", EXPORT_ACTION);

  const { data, count, error } = await query;
  if (error) throw error;
  const emails = await getAdminEmailMap((data ?? []).map((row) => row.actor_id));

  const rows = (data ?? []).map((row) => ({
    id: row.id,
    at: row.created_at,
    actorType: row.actor_type,
    actorLabel: row.actor_id ? (emails.get(row.actor_id) ?? row.actor_type) : row.actor_type,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    details: summarize(row.metadata),
  }));
  return { rows, total: count ?? 0 };
}

export async function getAccessLog(page: number): Promise<Page<AccessEntry>> {
  const { data, count, error } = await createServiceClient()
    .from("login_attempts")
    .select("id, identifier, ip, success, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(page * AUDIT_PAGE_SIZE, (page + 1) * AUDIT_PAGE_SIZE - 1);
  if (error) throw error;
  const rows = (data ?? []).map((row) => ({ id: row.id, at: row.created_at, identifier: row.identifier, ip: row.ip, success: row.success }));
  return { rows, total: count ?? 0 };
}
