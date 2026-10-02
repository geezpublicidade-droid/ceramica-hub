"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guards";
import { logAdminAction } from "@/lib/audit-log";
import { GOALS, isGoalMetric, isMonthKey } from "@/lib/services/executive-goals";

type ActionResult = { success: true } | { success: false; error: string };

const GOAL_ROLES = ["super_admin", "admin", "financeiro"] as const;

/** Define (ou limpa, se `target` for null) a meta de um mês. Dinheiro chega em centavos. */
export async function saveGoal(month: string, metric: string, target: number | null): Promise<ActionResult> {
  const adminId = await requireAdmin([...GOAL_ROLES]);
  if (!isMonthKey(month) || !isGoalMetric(metric)) return { success: false, error: "Meta inválida." };
  if (target !== null && (!Number.isFinite(target) || target < 0)) return { success: false, error: "Valor inválido." };
  if (target !== null && GOALS[metric].unit === "percent" && target > 100) return { success: false, error: "Percentual vai de 0 a 100." };

  const supabase = createServiceClient();
  const { error } =
    target === null
      ? await supabase.from("business_goals").delete().eq("month", month).eq("metric", metric)
      : await supabase
          .from("business_goals")
          .upsert(
            { month, metric, target, updated_by_admin_id: adminId, updated_at: new Date().toISOString() },
            { onConflict: "month,metric" }
          );
  if (error) return { success: false, error: "Não foi possível salvar a meta." };

  await logAdminAction(adminId, "save_goal", "business_goal", adminId, { month, metric, target });
  revalidatePath("/admin/executivo");
  return { success: true };
}
