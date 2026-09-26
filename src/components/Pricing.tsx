import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PLAN_ORDER, PLAN_PRICE_DISPLAY } from "@/lib/plan-limits";

export async function Pricing() {
  const t = await getTranslations("Pricing");

  const plans = PLAN_ORDER.map((key) => {
    const { hasPeriod, price } = PLAN_PRICE_DISPLAY[key];
    return {
      key,
      name: t(`plans.${key}.name`),
      description: t(`plans.${key}.description`),
      features: t.raw(`plans.${key}.features`) as string[],
      price,
      period: hasPeriod ? t("perMonth") : "",
      highlight: key === "destaque",
      badge: key === "destaque" ? t("mostChosen") : null,
    };
  });

  return (
    <section id="planos" className="relative overflow-hidden bg-surface">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-25 blur-[120px]"
        style={{ background: "radial-gradient(circle, var(--primary-light), transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-6xl px-6 py-28">
        <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-tight tracking-tight">
          {t("heading")}
        </h2>
        <p className="mt-3 max-w-xl text-[17px] text-muted">{t("subheading")}</p>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`relative flex flex-col rounded-3xl p-8 ${
                plan.highlight
                  ? "gradient-terracotta-animated text-white shadow-[0_30px_60px_-20px_rgba(227,83,54,0.45)]"
                  : "glass-light text-foreground"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-8 rounded-full bg-white px-3 py-1 text-[13px] font-medium text-primary shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className={`mt-2 text-[16px] ${plan.highlight ? "text-white/70" : "text-muted"}`}>
                {plan.description}
              </p>
              <p className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
                <span className={plan.highlight ? "text-white/60" : "text-muted"}>{plan.period}</span>
              </p>
              <ul className="mt-8 flex-1 space-y-3 text-[16px]">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className={plan.highlight ? "text-white/60" : "text-accent"}>—</span>
                    <span className={plan.highlight ? "text-white/90" : "text-muted"}>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/cadastro"
                className={`mt-8 block rounded-full px-6 py-3 text-center text-[16px] font-medium transition-transform active:scale-[0.98] ${
                  plan.highlight
                    ? "bg-white text-primary shadow-[6px_6px_14px_rgba(75,22,12,0.25),-6px_-6px_14px_rgba(255,255,255,0.5)]"
                    : "neu-primary text-white"
                }`}
              >
                {t("ctaChoosePlan")}
              </Link>
              <Link
                href={`/planos/${plan.key}`}
                className={`mt-3 block text-center text-[14px] font-medium hover:underline ${
                  plan.highlight ? "text-white/80" : "text-primary"
                }`}
              >
                {t("ctaSeeDetails")}
              </Link>
            </div>
          ))}
        </div>

        {/* Patrocinador não é um plano de autoatendimento (exige conversa com
           o time), por isso fica separado dos 4 cards comparáveis acima, numa
           faixa horizontal em vez de disputar espaço/coluna com eles. */}
        <div className="mt-8 flex flex-col items-start gap-6 rounded-3xl bg-graphite p-8 text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <h3 className="text-lg font-semibold">{t("plans.patrocinador.name")}</h3>
            <p className="mt-2 text-[16px] text-white/70">{t("plans.patrocinador.description")}</p>
            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-white/80">
              {(t.raw("plans.patrocinador.features") as string[]).map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="text-white/50">—</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
            <span className="text-[22px] font-semibold tracking-tight">{t("priceOnRequest")}</span>
            <Link
              href="/seja-um-parceiro?tipo=patrocinador"
              className="rounded-full bg-white px-6 py-3 text-center text-[16px] font-medium text-graphite transition-transform active:scale-[0.98]"
            >
              {t("ctaTalkToUs")}
            </Link>
            <Link href="/planos/patrocinador" className="text-[14px] font-medium text-white/80 hover:underline">
              {t("ctaSeeDetails")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
