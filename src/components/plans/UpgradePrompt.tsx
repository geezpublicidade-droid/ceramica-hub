"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { featureDefinition, normalizeFeatureKey } from "@/lib/plans/features";
import { usePlanFeatures } from "./PlanProvider";

type UpgradePromptProps = {
  /** recurso bloqueado (chave da matriz ou apelido, ex.: "featured_video") */
  feature: string;
  /** nome mostrado ao usuário; padrão = rótulo do recurso */
  label?: string;
  /** texto extra de valor, ex.: "Publique até 6 serviços com fotos" */
  description?: string;
  /** visual compacto (uma linha) */
  compact?: boolean;
};

/** "🔒 Vídeo em destaque — Disponível no plano Experiência. [Conhecer plano]". Aparece só no painel, nunca na página pública. */
export function UpgradePrompt({ feature, label, description, compact = false }: UpgradePromptProps) {
  const { requiredPlanFor } = usePlanFeatures();
  const key = normalizeFeatureKey(feature);
  const name = label ?? (key ? featureDefinition(key)?.label : undefined) ?? feature;
  const required = requiredPlanFor(feature);

  return (
    <div className={`rounded-lg border border-dashed border-border bg-black/[0.02] ${compact ? "flex flex-wrap items-center gap-x-3 gap-y-1 px-3.5 py-2.5" : "px-4 py-3.5"}`}>
      <p className="flex items-center gap-2 text-[14.5px] font-medium text-foreground">
        <Lock className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        {name}
      </p>
      <p className="text-[13.5px] text-muted">
        {required ? `Disponível no plano ${required.name}.` : "Disponível sob consulta."}
        {description ? ` ${description}` : ""}
      </p>
      <Link href={required ? `/planos/${required.key}` : "/planos"} className="tap text-[13.5px] font-semibold text-primary hover:underline">
        Conhecer plano →
      </Link>
    </div>
  );
}
