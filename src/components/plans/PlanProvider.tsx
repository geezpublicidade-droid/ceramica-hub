"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { canAccess as canAccessFeature, getFeatureValue, getLimit as getFeatureLimit, lowestPlanWith } from "@/lib/plans/resolve";
import type { FeatureMap, FeatureValue, PlanKey } from "@/lib/plans/features";
import type { ClientPermissions } from "@/lib/services/company-plan";

/** Planos em ordem de upgrade com os recursos de cada um (para "disponível no plano X" e para comparar). */
export type PlanLadderEntry = { key: PlanKey; name: string; features: FeatureMap };

export type PlanContextValue = { permissions: ClientPermissions; ladder: PlanLadderEntry[] };

const PlanContext = createContext<PlanContextValue | null>(null);

/**
 * Entrega ao navegador o plano em vigor e os recursos da empresa. É só comodidade de interface: o servidor SEMPRE confere de novo
 * (getCompanyPermissions / gateFeature / gateLimit e os triggers do banco). Montado no painel da empresa e nas telas de admin por empresa.
 */
export function PlanProvider({ value, children }: { value: PlanContextValue; children: ReactNode }) {
  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

function usePlanContext(): PlanContextValue {
  const context = useContext(PlanContext);
  if (!context) throw new Error("PlanProvider ausente: envolva a tela com <PlanProvider>.");
  return context;
}

/** Plano em vigor, status e prazos da empresa. `companyId` (opcional) confere que o provider é da empresa esperada. */
export function useCompanyPlan(companyId?: string) {
  const { permissions } = usePlanContext();
  if (companyId && companyId !== permissions.businessId) throw new Error("PlanProvider pertence a outra empresa.");
  return permissions;
}

export type PlanFeaturesApi = {
  plan: PlanKey;
  planName: string;
  features: Readonly<FeatureMap>;
  canAccess: (key: string) => boolean;
  /** limite numérico (Infinity = ilimitado) */
  getLimit: (key: string) => number;
  getValue: (key: string) => FeatureValue | undefined;
  /** primeiro plano que libera o recurso (null se nenhum) */
  requiredPlanFor: (key: string) => { key: PlanKey; name: string } | null;
};

/** Ex.: `const { canAccess, getLimit, plan } = usePlanFeatures(companyId); if (canAccess("featured_video")) …` */
export function usePlanFeatures(companyId?: string): PlanFeaturesApi {
  const { permissions, ladder } = usePlanContext();
  if (companyId && companyId !== permissions.businessId) throw new Error("PlanProvider pertence a outra empresa.");

  return useMemo(
    () => ({
      plan: permissions.plan,
      planName: permissions.planName,
      features: permissions.features,
      canAccess: (key: string) => canAccessFeature(permissions.features, key),
      getLimit: (key: string) => getFeatureLimit(permissions.features, key),
      getValue: (key: string) => getFeatureValue(permissions.features, key),
      requiredPlanFor: (key: string) => {
        const plan = lowestPlanWith(key, ladder);
        return plan ? { key: plan, name: ladder.find((entry) => entry.key === plan)?.name ?? plan } : null;
      },
    }),
    [permissions, ladder],
  );
}

export function usePlanLadder(): PlanLadderEntry[] {
  return usePlanContext().ladder;
}
