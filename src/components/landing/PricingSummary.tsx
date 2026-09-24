import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FadeUp } from "@/components/motion/FadeUp";
import { PLAN_ORDER, PLAN_PRICE_DISPLAY } from "@/lib/plan-limits";

/** Versão resumida dos planos pra home -- só nome, preço, 1 linha e CTA. A
 * comparação completa com todas as features mora em /planos (ver
 * Pricing.tsx), longe da narrativa emocional que vem antes desta seção. */
export async function PricingSummary() {
  const t = await getTranslations("Pricing");
  const tSummary = await getTranslations("PricingSummary");

  const plans = PLAN_ORDER.map((key) => {
    const { price, hasPeriod } = PLAN_PRICE_DISPLAY[key];
    return {
      key,
      name: t(`plans.${key}.name`),
      description: t(`plans.${key}.description`),
      price,
      period: hasPeriod ? t("perMonth") : "",
      highlight: key === "destaque",
      badge: key === "destaque" ? t("mostChosen") : null,
    };
  });

  return (
    <section id="planos" className="section-pad-y bg-surface">
      <div className="container-page">
        <FadeUp className="max-w-2xl">
          <p className="text-[15px] font-medium uppercase tracking-[0.2em] text-primary">{tSummary("eyebrow")}</p>
          <h2 className="mt-3 text-[clamp(1.8rem,3.2vw,2.5rem)] font-semibold leading-tight tracking-tight">
            {t("heading")}
          </h2>
          <p className="mt-3 text-[17px] text-muted">{t("subheading")}</p>
        </FadeUp>

        <div className="mt-10 grid grid-cols-1 gap-[var(--card-gap)] sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, index) => (
            <FadeUp
              key={plan.key}
              delay={index * 0.08}
              className={`relative flex flex-col rounded-3xl p-7 transition-transform duration-300 hover:-translate-y-1.5 ${
                plan.highlight ? "gradient-terracotta-animated text-white" : "border border-border text-foreground"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-7 rounded-full bg-white px-3 py-1 text-[12px] font-medium text-primary shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-[17px] font-semibold">{plan.name}</h3>
              <p className={`mt-1.5 flex-1 text-[14px] ${plan.highlight ? "text-white/70" : "text-muted"}`}>
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
              <Link
                href={`/planos/${plan.key}`}
                className={`mt-2 block text-center text-[13px] font-medium hover:underline ${
                  plan.highlight ? "text-white/80" : "text-primary"
                }`}
              >
                {t("ctaSeeDetails")}
              </Link>
            </FadeUp>
          ))}
        </div>

        {/* Patrocinador não é autoatendimento -- faixa compacta separada,
           mesma lógica de disposição da versão completa em Pricing.tsx. */}
        <FadeUp
          delay={0.2}
          className="mt-5 flex flex-col items-start gap-4 rounded-3xl bg-graphite p-6 text-white transition-transform duration-300 hover:-translate-y-1 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h3 className="text-[16px] font-semibold">{t("plans.patrocinador.name")}</h3>
            <p className="mt-1 text-[14px] text-white/70">{t("plans.patrocinador.description")}</p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <span className="text-[15px] font-medium text-white/80">{t("priceOnRequest")}</span>
            <Link
              href="/seja-um-parceiro"
              className="whitespace-nowrap rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-graphite"
            >
              {t("ctaTalkToUs")}
            </Link>
          </div>
        </FadeUp>

        <Link href="/planos" className="mt-10 inline-block text-[15px] font-medium text-primary hover:underline">
          {tSummary("ctaSeeAllPlans")} →
        </Link>
      </div>
    </section>
  );
}
