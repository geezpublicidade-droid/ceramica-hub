import { getTranslations } from "next-intl/server";
import { loadPlanCatalog } from "@/lib/services/plan-catalog";
import { loadPlanPrices } from "@/lib/services/plan-prices";
import { FEATURE_DEFINITIONS, type FeatureMap, type PlanKey } from "@/lib/plans/features";
import { canAccess, formatFeatureValue } from "@/lib/plans/resolve";

export type DisplayPlan = {
  key: PlanKey;
  name: string;
  description: string;
  /** "R$ 79", "R$ 0" ou null (sob consulta) */
  priceLabel: string | null;
  isSponsor: boolean;
  features: FeatureMap;
};

/** "R$ 79" (sem centavos quando o valor é redondo), a partir do preço do catálogo comercial. */
export function formatPlanPrice(cents: number): string {
  const reais = cents / 100;
  return `R$ ${Number.isInteger(reais) ? reais : reais.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

/** Planos que aparecem na página pública, na ordem de upgrade: nomes e recursos do catálogo, preços do catálogo comercial. */
export async function getPublicPlans(): Promise<DisplayPlan[]> {
  const [catalog, prices] = await Promise.all([loadPlanCatalog(), loadPlanPrices()]);
  return catalog.plans
    .filter((plan) => plan.active && plan.isPublic)
    .sort((a, b) => a.rank - b.rank)
    .map((plan) => {
      const price = prices[plan.key];
      const onRequest = plan.billingType === "personalizado" || price?.monthlyCents == null;
      return {
        key: plan.key,
        name: plan.name,
        description: plan.description,
        priceLabel: onRequest ? null : formatPlanPrice(price.monthlyCents ?? 0),
        isSponsor: plan.billingType === "personalizado",
        features: catalog.features[plan.key],
      };
    });
}

export type PlanTexts = { name: string; description: string; features: string[] };

/** Texto traduzido do plano quando existe; planos criados no admin usam nome/descrição do catálogo e a lista gerada da matriz. */
export async function planTexts(plan: DisplayPlan, locale: string): Promise<PlanTexts> {
  const t = await getTranslations({ locale, namespace: "Pricing" });
  const translated = t.has(`plans.${plan.key}.name`);
  return {
    name: translated ? t(`plans.${plan.key}.name`) : plan.name,
    description: translated ? t(`plans.${plan.key}.description`) : plan.description,
    features: translated ? (t.raw(`plans.${plan.key}.features`) as string[]) : featureBullets(plan.features),
  };
}

/** Lista de benefícios gerada da matriz — usada para planos criados no admin, que não têm texto traduzido. */
export function featureBullets(features: FeatureMap): string[] {
  return FEATURE_DEFINITIONS.filter((def) => canAccess(features, def.key) && def.key !== "basic_page" && def.key !== "claim_profile").map((def) =>
    def.kind === "flag" ? def.label : `${def.label}: ${formatFeatureValue(def.key, features[def.key]).toLowerCase()}`,
  );
}
