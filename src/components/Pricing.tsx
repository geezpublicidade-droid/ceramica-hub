import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type PlanKey = "presenca" | "profissional" | "destaque" | "experiencia";

const PLAN_PRICE: Record<PlanKey, { price: string; hasPeriod: boolean }> = {
  presenca: { price: "R$ 0", hasPeriod: false },
  profissional: { price: "R$ 47", hasPeriod: true },
  destaque: { price: "R$ 97", hasPeriod: true },
  experiencia: { price: "R$ 197", hasPeriod: true },
};

const PLAN_ORDER: PlanKey[] = ["presenca", "profissional", "destaque", "experiencia"];

export async function Pricing() {
  const t = await getTranslations("Pricing");

  const plans = PLAN_ORDER.map((key) => {
    const { hasPeriod, ...rest } = PLAN_PRICE[key];
    return {
      key,
      name: t(`plans.${key}.name`),
      description: t(`plans.${key}.description`),
      features: t.raw(`plans.${key}.features`) as string[],
      ...rest,
      period: hasPeriod ? t("perMonth") : "",
      variant: key === "destaque" ? ("highlight" as const) : ("default" as const),
      badge: key === "destaque" ? t("mostChosen") : null,
      href: "/cadastro",
      cta: t("ctaChoosePlan"),
    };
  });

  /** Não é um plano de autoatendimento -- exige conversa com o time, por
   * isso não entra no Business["plan"] nem em plan-limits.ts, só na vitrine. */
  const sponsorPlan = {
    key: "patrocinador",
    name: t("plans.patrocinador.name"),
    description: t("plans.patrocinador.description"),
    features: t.raw("plans.patrocinador.features") as string[],
    price: t("priceOnRequest"),
    period: "",
    variant: "sponsor" as const,
    badge: null as string | null,
    href: "/seja-um-parceiro",
    cta: t("ctaTalkToUs"),
  };

  const allPlans = [...plans, sponsorPlan];

  return (
    <section id="planos" className="relative overflow-hidden bg-surface">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-25 blur-[120px]"
        style={{ background: "radial-gradient(circle, var(--primary-light), transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-7xl px-6 py-28">
        <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-tight tracking-tight">
          {t("heading")}
        </h2>
        <p className="mt-3 max-w-xl text-[17px] text-muted">{t("subheading")}</p>
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-5">
          {allPlans.map((plan) => {
            const isHighlight = plan.variant === "highlight";
            const isSponsor = plan.variant === "sponsor";
            return (
              <div
                key={plan.key}
                className={`relative rounded-3xl p-8 ${
                  isHighlight
                    ? "gradient-terracotta-animated text-white shadow-[0_30px_60px_-20px_rgba(227,83,54,0.45)]"
                    : isSponsor
                      ? "bg-graphite text-white shadow-[0_30px_60px_-20px_rgba(46,46,46,0.5)]"
                      : "glass-light text-foreground"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-8 rounded-full bg-white px-3 py-1 text-[13px] font-medium text-primary shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                    {plan.badge}
                  </span>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className={`mt-2 text-[16px] ${isHighlight || isSponsor ? "text-white/70" : "text-muted"}`}>
                  {plan.description}
                </p>
                <p className="mt-6 flex items-baseline gap-1">
                  <span className={isSponsor ? "text-2xl font-semibold tracking-tight" : "text-4xl font-semibold tracking-tight"}>
                    {plan.price}
                  </span>
                  <span className={isHighlight || isSponsor ? "text-white/60" : "text-muted"}>{plan.period}</span>
                </p>
                <ul className="mt-8 space-y-3 text-[16px]">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className={isHighlight || isSponsor ? "text-white/60" : "text-accent"}>—</span>
                      <span className={isHighlight || isSponsor ? "text-white/90" : "text-muted"}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`mt-8 block rounded-full px-6 py-3 text-center text-[16px] font-medium transition-transform active:scale-[0.98] ${
                    isHighlight
                      ? "bg-white text-primary shadow-[6px_6px_14px_rgba(75,22,12,0.25),-6px_-6px_14px_rgba(255,255,255,0.5)]"
                      : isSponsor
                        ? "border border-white/30 text-white hover:bg-white/10"
                        : "neu-primary text-white"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
