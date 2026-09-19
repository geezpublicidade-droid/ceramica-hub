import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type SummaryPlanKey = "presenca" | "destaque" | "experiencia";

const SUMMARY_PRICE: Record<SummaryPlanKey, string> = {
  presenca: "R$ 0",
  destaque: "R$ 97",
  experiencia: "R$ 197",
};

const SUMMARY_ORDER: SummaryPlanKey[] = ["presenca", "destaque", "experiencia"];

/** Versão resumida dos planos pra home -- só nome, preço, 1 linha e CTA. A
 * comparação completa com todas as features mora em /planos (ver
 * Pricing.tsx), longe da narrativa emocional que vem antes desta seção. */
export async function PricingSummary() {
  const t = await getTranslations("Pricing");
  const tSummary = await getTranslations("PricingSummary");

  const plans = SUMMARY_ORDER.map((key) => ({
    key,
    name: t(`plans.${key}.name`),
    description: t(`plans.${key}.description`),
    price: SUMMARY_PRICE[key],
    period: key === "presenca" ? "" : t("perMonth"),
    highlight: key === "destaque",
    badge: key === "destaque" ? t("mostChosen") : null,
  }));

  return (
    <section id="planos" className="bg-surface px-6 py-28">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-2xl">
          <p className="text-[15px] font-medium uppercase tracking-[0.2em] text-primary">{tSummary("eyebrow")}</p>
          <h2 className="mt-4 text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-tight tracking-tight">
            {t("heading")}
          </h2>
          <p className="mt-3 text-[17px] text-muted">{t("subheading")}</p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`relative rounded-3xl p-7 ${
                plan.highlight ? "gradient-terracotta-animated text-white" : "border border-border text-foreground"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-7 rounded-full bg-white px-3 py-1 text-[12px] font-medium text-primary shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-[17px] font-semibold">{plan.name}</h3>
              <p className={`mt-1.5 text-[14px] ${plan.highlight ? "text-white/70" : "text-muted"}`}>
                {plan.description}
              </p>
              <p className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight">{plan.price}</span>
                <span className={plan.highlight ? "text-white/60" : "text-muted"}>{plan.period}</span>
              </p>
              <Link
                href="/cadastro"
                className={`mt-6 block rounded-full px-5 py-2.5 text-center text-[15px] font-medium ${
                  plan.highlight ? "bg-white text-primary" : "neu-primary text-white"
                }`}
              >
                {t("ctaChoosePlan")}
              </Link>
            </div>
          ))}
        </div>

        <Link href="/planos" className="mt-10 inline-block text-[15px] font-medium text-primary hover:underline">
          {tSummary("ctaSeeAllPlans")} →
        </Link>
      </div>
    </section>
  );
}
