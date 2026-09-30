import { createServiceClient } from "@/lib/supabase/server";
import { sendEmailDetailed } from "@/lib/services/email";
import { AUTOMATIONS, AUTOMATION_KEYS, type AutomationKey } from "./registry";
import { collectJobs } from "./rules";
import type { AutomationJob } from "./types";

const MAX_ATTEMPTS = 3;
const CONCURRENCY = 4;

type Suppression = { unsubscribed: Set<string>; consented: Set<string> };

async function loadSuppression(): Promise<Suppression> {
  const supabase = createServiceClient();
  const [unsub, consent] = await Promise.all([
    supabase.from("email_unsubscribes").select("email"),
    supabase.from("email_consents").select("email").is("revoked_at", null),
  ]);
  if (unsub.error) throw unsub.error;
  if (consent.error) throw consent.error;
  return {
    unsubscribed: new Set((unsub.data ?? []).map((row) => row.email.toLowerCase())),
    consented: new Set((consent.data ?? []).map((row) => row.email.toLowerCase())),
  };
}

/** Empresa descadastrada nunca recebe; automação de marketing ainda exige consentimento ativo. */
function isAllowed(job: AutomationJob, suppression: Suppression): boolean {
  if (AUTOMATIONS[job.automation].audience === "admin") return true;
  const email = job.to.toLowerCase();
  if (suppression.unsubscribed.has(email)) return false;
  return !AUTOMATIONS[job.automation].requiresConsent || suppression.consented.has(email);
}

type Claim = { id: string; token: string; attempts: number };

/** Reserva o envio: a chave única (automação, dedupe, destinatário) impede duplicar; falha com tentativas sobrando pode ser repetida. */
async function claim(job: AutomationJob): Promise<Claim | null> {
  const supabase = createServiceClient();
  const key = { automation: job.automation, dedupe_key: job.dedupeKey, recipient_email: job.to.toLowerCase() };
  const { data: inserted, error } = await supabase
    .from("automation_log")
    .upsert({ ...key, business_id: job.businessId ?? null }, { onConflict: "automation,dedupe_key,recipient_email", ignoreDuplicates: true })
    .select("id, unsubscribe_token, attempts")
    .maybeSingle();
  if (error) throw error;
  if (inserted) return { id: inserted.id, token: inserted.unsubscribe_token, attempts: inserted.attempts };

  const { data: existing, error: lookupError } = await supabase
    .from("automation_log")
    .select("id, unsubscribe_token, attempts, status")
    .match(key)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing?.status === "failed" && existing.attempts < MAX_ATTEMPTS) {
    return { id: existing.id, token: existing.unsubscribe_token, attempts: existing.attempts };
  }
  return null;
}

type DispatchOutcome = "sent" | "failed" | "skipped";

async function dispatch(job: AutomationJob, suppression: Suppression): Promise<DispatchOutcome> {
  if (!isAllowed(job, suppression)) return "skipped";
  const reservation = await claim(job);
  if (!reservation) return "skipped";

  const supabase = createServiceClient();
  const isBusinessMail = AUTOMATIONS[job.automation].audience === "business";
  try {
    const { subject, html } = await job.build(isBusinessMail ? reservation.token : null);
    const result = await sendEmailDetailed({ to: job.to, subject, html });
    await supabase
      .from("automation_log")
      .update({
        status: result.ok ? "sent" : "failed",
        attempts: reservation.attempts + 1,
        error: result.ok ? null : result.error,
        sent_at: result.ok ? new Date().toISOString() : null,
      })
      .eq("id", reservation.id);
    return result.ok ? "sent" : "failed";
  } catch (error) {
    await supabase
      .from("automation_log")
      .update({ status: "failed", attempts: reservation.attempts + 1, error: error instanceof Error ? error.message.slice(0, 300) : "erro" })
      .eq("id", reservation.id);
    return "failed";
  }
}

export type AutomationRunResult = { automation: AutomationKey; sent: number; failed: number; skipped: number };

async function runWithConcurrency(jobs: AutomationJob[], suppression: Suppression) {
  const counts = { sent: 0, failed: 0, skipped: 0 };
  const queue = [...jobs];
  async function worker() {
    for (let job = queue.shift(); job; job = queue.shift()) {
      try {
        counts[await dispatch(job, suppression)] += 1;
      } catch (error) {
        console.error(`[automations] ${job.automation}:`, error);
        counts.failed += 1;
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return counts;
}

export async function getEnabledAutomations(): Promise<Record<AutomationKey, boolean>> {
  const { data, error } = await createServiceClient().from("automation_settings").select("automation, enabled");
  if (error) throw error;
  const disabled = new Set((data ?? []).filter((row) => !row.enabled).map((row) => row.automation));
  return Object.fromEntries(AUTOMATION_KEYS.map((key) => [key, !disabled.has(key)])) as Record<AutomationKey, boolean>;
}

/** Roda uma automação (ou todas as ligadas, sem argumento). Uma regra que quebra não derruba as outras. */
export async function runAutomations(only?: AutomationKey): Promise<AutomationRunResult[]> {
  const [enabled, suppression] = await Promise.all([getEnabledAutomations(), loadSuppression()]);
  const keys = only ? [only] : AUTOMATION_KEYS.filter((key) => enabled[key]);

  const results: AutomationRunResult[] = [];
  for (const automation of keys) {
    try {
      const jobs = await collectJobs(automation);
      results.push({ automation, ...(await runWithConcurrency(jobs, suppression)) });
    } catch (error) {
      console.error(`[automations] regra ${automation} falhou:`, error);
      results.push({ automation, sent: 0, failed: 1, skipped: 0 });
    }
  }
  return results;
}

export type AutomationStats = { sent: number; failed: number; lastSentAt: string | null };

/** Envios e falhas dos últimos 30 dias por automação, pra tela do admin. */
export async function getAutomationStats(): Promise<Record<AutomationKey, AutomationStats>> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await createServiceClient().from("automation_log").select("automation, status, sent_at").gte("created_at", since);
  if (error) throw error;

  const stats = Object.fromEntries(AUTOMATION_KEYS.map((key) => [key, { sent: 0, failed: 0, lastSentAt: null }])) as Record<AutomationKey, AutomationStats>;
  for (const row of data ?? []) {
    const entry = stats[row.automation as AutomationKey];
    if (!entry) continue;
    if (row.status === "sent") entry.sent += 1;
    if (row.status === "failed") entry.failed += 1;
    if (row.sent_at && (!entry.lastSentAt || row.sent_at > entry.lastSentAt)) entry.lastSentAt = row.sent_at;
  }
  return stats;
}
