import { getCompanyPermissions, toClientPermissions } from "@/lib/services/company-plan";
import { loadPlanCatalog, planLadder } from "@/lib/services/plan-catalog";
import type { PlanContextValue } from "@/components/plans/PlanProvider";

/** Valor do <PlanProvider> para uma empresa (servidor). null se a empresa não existe. */
export async function getPlanProviderValue(businessId: string): Promise<PlanContextValue | null> {
  const [permissions, catalog] = await Promise.all([getCompanyPermissions(businessId), loadPlanCatalog()]);
  if (!permissions) return null;
  return { permissions: toClientPermissions(permissions), ladder: planLadder(catalog) };
}
