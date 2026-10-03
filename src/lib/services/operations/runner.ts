import { createServiceClient } from "@/lib/supabase/server";
import { OPERATIONAL_RULES, type OperationalRule } from "./catalog";
import {
  inactiveBusinessRule,
  leadFollowupRule,
  overduePaymentRule,
  placementExpiredRule,
  placementReleaseRule,
  proposalExpiredRule,
  proposalExpiringRule,
  subscriptionExpiredRule,
} from "./rules";

type Supabase = ReturnType<typeof createServiceClient>;

const RULES: Record<OperationalRule, (supabase: Supabase) => Promise<number>> = {
  lead_followup: leadFollowupRule,
  proposal_expiring: proposalExpiringRule,
  proposal_expired: proposalExpiredRule,
  overdue_payment: overduePaymentRule,
  inactive_business: inactiveBusinessRule,
  subscription_expired: subscriptionExpiredRule,
  placement_release: placementReleaseRule,
  placement_expired: placementExpiredRule,
};

export type OperationalRunResult = { rule: OperationalRule; affected: number; failed: boolean };

/** Roda todas as regras operacionais. Uma regra que quebra não derruba as outras. */
export async function runOperationalRules(): Promise<OperationalRunResult[]> {
  const supabase = createServiceClient();
  const results: OperationalRunResult[] = [];
  for (const rule of OPERATIONAL_RULES) {
    try {
      results.push({ rule, affected: await RULES[rule](supabase), failed: false });
    } catch (error) {
      console.error(`[operations] regra ${rule} falhou:`, error);
      results.push({ rule, affected: 0, failed: true });
    }
  }
  return results;
}

/** Tarefas automáticas ainda em aberto por regra, pra tela do admin. */
export async function getOpenAutoTaskCounts(): Promise<Record<OperationalRule, number>> {
  const { data, error } = await createServiceClient()
    .from("tasks")
    .select("auto_rule")
    .not("auto_rule", "is", null)
    .in("status", ["pendente", "em_andamento"]);
  if (error) throw error;
  const counts = Object.fromEntries(OPERATIONAL_RULES.map((rule) => [rule, 0])) as Record<OperationalRule, number>;
  for (const row of data ?? []) {
    if (row.auto_rule in counts) counts[row.auto_rule as OperationalRule] += 1;
  }
  return counts;
}
