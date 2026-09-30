"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guards";
import { logAdminAction } from "@/lib/audit-log";
import { runAutomations, type AutomationRunResult } from "@/lib/services/automations/engine";
import { AUTOMATION_KEYS, type AutomationKey } from "@/lib/services/automations/registry";

type ActionResult = { success: true } | { success: false; error: string };
type RunResult = { success: true; result: AutomationRunResult } | { success: false; error: string };

const AUTOMATION_ROLES = ["super_admin", "admin", "marketing"] as const;

function isAutomationKey(value: string): value is AutomationKey {
  return (AUTOMATION_KEYS as readonly string[]).includes(value);
}

export async function setAutomationEnabled(automation: string, enabled: boolean): Promise<ActionResult> {
  const adminId = await requireAdmin([...AUTOMATION_ROLES]);
  if (!isAutomationKey(automation)) return { success: false, error: "Automação desconhecida." };

  const { error } = await createServiceClient()
    .from("automation_settings")
    .upsert({ automation, enabled, updated_at: new Date().toISOString() });
  if (error) return { success: false, error: "Não foi possível salvar." };

  await logAdminAction(adminId, "set_automation_enabled", "automation", automation, { enabled });
  revalidatePath("/admin/marketing/automacoes");
  return { success: true };
}

/** "Executar agora": roda só esta automação, sem esperar o cron diário. Respeita a mesma trava de envio único. */
export async function runAutomationNow(automation: string): Promise<RunResult> {
  const adminId = await requireAdmin([...AUTOMATION_ROLES]);
  if (!isAutomationKey(automation)) return { success: false, error: "Automação desconhecida." };

  const [result] = await runAutomations(automation);
  await logAdminAction(adminId, "run_automation_now", "automation", automation, { ...result });
  revalidatePath("/admin/marketing/automacoes");
  return { success: true, result };
}
