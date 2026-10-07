"use client";

import type { ReactNode } from "react";
import { usePlanFeatures } from "./PlanProvider";
import { UpgradePrompt } from "./UpgradePrompt";

type PlanGateProps = {
  /** recurso exigido */
  feature: string;
  children: ReactNode;
  /** o que mostrar quando bloqueado: "lock" (padrão) = convite ao upgrade; "hide" = nada; ou um nó próprio */
  fallback?: "lock" | "hide" | ReactNode;
  label?: string;
  description?: string;
};

/** Mostra `children` só se o plano em vigor libera o recurso. No painel, o bloqueado aparece como convite ao upgrade. */
export function PlanGate({ feature, children, fallback = "lock", label, description }: PlanGateProps) {
  const { canAccess } = usePlanFeatures();
  if (canAccess(feature)) return <>{children}</>;
  if (fallback === "hide") return null;
  if (fallback === "lock") return <UpgradePrompt feature={feature} label={label} description={description} />;
  return <>{fallback}</>;
}
