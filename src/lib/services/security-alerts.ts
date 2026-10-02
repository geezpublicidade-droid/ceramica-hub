import { createServiceClient } from "@/lib/supabase/server";
import { DELETE_ACTION_PATTERN, EXPORT_ACTION } from "@/lib/audit-actions";
import { getAdminEmailMap } from "@/lib/services/admin-emails";

/** Detecção de atividade suspeita (Fase 4.8). A lógica é pura; só o carregador acessa o banco. */

const HOUR_MS = 60 * 60 * 1000;
const TEN_MINUTES_MS = 10 * 60 * 1000;
const LOOKBACK_MS = 24 * HOUR_MS;
const MAX_ROWS = 2000;

const FAILED_LOGINS_PER_ACCOUNT = 5;
const FAILED_LOGINS_PER_IP = 10;
const DELETES_PER_BURST = 5;
const EXPORTS_PER_HOUR = 3;

export type SuspiciousEvent = { key: string; severity: "danger" | "warning"; message: string };
export type LoginAttempt = { identifier: string; ip: string | null; success: boolean; createdAt: string };
export type AuditEntryLite = { action: string; actorId: string | null; actorLabel: string; createdAt: string };

function groupBy<T>(items: T[], keyOf: (item: T) => string | null): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    if (!key) continue;
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  return groups;
}

/** Maior quantidade de eventos dentro de uma janela deslizante de `windowMs`. */
export function maxInWindow(times: number[], windowMs: number): number {
  const sorted = [...times].sort((a, b) => a - b);
  let best = 0;
  let start = 0;
  for (let end = 0; end < sorted.length; end++) {
    while (sorted[end] - sorted[start] > windowMs) start++;
    best = Math.max(best, end - start + 1);
  }
  return best;
}

const at = (iso: string) => new Date(iso).getTime();

function failedLoginEvents(attempts: LoginAttempt[]): SuspiciousEvent[] {
  const failed = attempts.filter((a) => !a.success);
  const events: SuspiciousEvent[] = [];
  for (const [identifier, group] of groupBy(failed, (a) => a.identifier)) {
    const count = maxInWindow(group.map((a) => at(a.createdAt)), HOUR_MS);
    if (count >= FAILED_LOGINS_PER_ACCOUNT) {
      events.push({ key: `brute:${identifier}`, severity: "danger", message: `${count} logins falhos em 1 hora para ${identifier}` });
    }
  }
  for (const [ip, group] of groupBy(failed, (a) => a.ip)) {
    const count = maxInWindow(group.map((a) => at(a.createdAt)), HOUR_MS);
    if (count >= FAILED_LOGINS_PER_IP) {
      events.push({ key: `spray:${ip}`, severity: "danger", message: `${count} logins falhos em 1 hora vindos do IP ${ip}` });
    }
  }
  return events;
}

/** Login que deu certo logo depois de uma sequência de falhas na mesma conta: possível senha adivinhada. */
function successAfterFailuresEvents(attempts: LoginAttempt[]): SuspiciousEvent[] {
  const events: SuspiciousEvent[] = [];
  for (const [identifier, group] of groupBy(attempts, (a) => a.identifier)) {
    const sorted = [...group].sort((a, b) => at(a.createdAt) - at(b.createdAt));
    sorted.forEach((attempt, index) => {
      if (!attempt.success) return;
      const failuresBefore = sorted.slice(0, index).filter((a) => !a.success && at(attempt.createdAt) - at(a.createdAt) <= HOUR_MS).length;
      if (failuresBefore >= FAILED_LOGINS_PER_ACCOUNT) {
        events.push({ key: `compromise:${identifier}:${attempt.createdAt}`, severity: "danger", message: `Login bem-sucedido de ${identifier} após ${failuresBefore} falhas seguidas` });
      }
    });
  }
  return events;
}

function adminActionEvents(entries: AuditEntryLite[]): SuspiciousEvent[] {
  const events: SuspiciousEvent[] = [];
  const deletes = entries.filter((e) => DELETE_ACTION_PATTERN.test(e.action));
  for (const [actor, group] of groupBy(deletes, (e) => e.actorId)) {
    const count = maxInWindow(group.map((e) => at(e.createdAt)), TEN_MINUTES_MS);
    if (count >= DELETES_PER_BURST) {
      events.push({ key: `deletes:${actor}`, severity: "warning", message: `${count} exclusões em 10 minutos por ${group[0].actorLabel}` });
    }
  }
  const exports = entries.filter((e) => e.action === EXPORT_ACTION);
  for (const [actor, group] of groupBy(exports, (e) => e.actorId)) {
    const count = maxInWindow(group.map((e) => at(e.createdAt)), HOUR_MS);
    if (count >= EXPORTS_PER_HOUR) {
      events.push({ key: `exports:${actor}`, severity: "warning", message: `${count} exportações de dados em 1 hora por ${group[0].actorLabel}` });
    }
  }
  return events;
}

export function detectSuspiciousActivity(attempts: LoginAttempt[], entries: AuditEntryLite[]): SuspiciousEvent[] {
  const events = [...failedLoginEvents(attempts), ...successAfterFailuresEvents(attempts), ...adminActionEvents(entries)];
  return events.sort((a, b) => Number(b.severity === "danger") - Number(a.severity === "danger"));
}

/** Atividade suspeita nas últimas 24 horas. */
export async function getSuspiciousActivity(now = new Date()): Promise<SuspiciousEvent[]> {
  const supabase = createServiceClient();
  const since = new Date(now.getTime() - LOOKBACK_MS).toISOString();
  const [attempts, audits] = await Promise.all([
    supabase.from("login_attempts").select("identifier, ip, success, created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(MAX_ROWS),
    supabase.from("audit_logs").select("action, actor_id, created_at").eq("actor_type", "admin").gte("created_at", since).order("created_at", { ascending: false }).limit(MAX_ROWS),
  ]);
  if (attempts.error) throw attempts.error;
  if (audits.error) throw audits.error;

  const emailById = await getAdminEmailMap((audits.data ?? []).map((row) => row.actor_id));

  return detectSuspiciousActivity(
    (attempts.data ?? []).map((row) => ({ identifier: row.identifier, ip: row.ip, success: row.success, createdAt: row.created_at })),
    (audits.data ?? []).map((row) => ({ action: row.action, actorId: row.actor_id, actorLabel: emailById.get(row.actor_id) ?? "admin", createdAt: row.created_at }))
  );
}
