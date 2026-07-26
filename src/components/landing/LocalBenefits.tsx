import { getTranslations } from "next-intl/server";
import { FadeUp } from "@/components/motion/FadeUp";
import type { BenefitWithBusiness } from "@/lib/services/platform";

type LocalBenefitsProps = {
  benefits: BenefitWithBusiness[];
};

export async function LocalBenefits({ benefits }: LocalBenefitsProps) {
  const t = await getTranslations("LocalBenefits");
  const tKinds = await getTranslations("benefitKindLabels");
  return (
    <section id="beneficios" className="relative overflow-hidden bg-background px-6 py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 bottom-0 h-[420px] w-[420px] rounded-full opacity-25 blur-[120px]"
        style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-6xl">
        <FadeUp className="max-w-2xl">
          <p className="text-[15px] font-medium uppercase tracking-[0.2em] text-primary">
            {t("eyebrow")}
          </p>
          <h2 className="mt-4 text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-tight tracking-tight">
            {t("headline")}
          </h2>
        </FadeUp>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, index) => (
            <FadeUp key={benefit.id} delay={index * 0.05} className="glass-card-light rounded-2xl p-6">
              <span className="inline-block rounded-full bg-primary/10 px-2.5 py-1 text-[13px] font-medium text-primary">
                {tKinds(benefit.kind)}
              </span>
              <p className="mt-4 text-[17px] font-semibold tracking-tight">{benefit.title}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{benefit.description}</p>
              <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-[12px] font-semibold">
                  {benefit.business.initials}
                </div>
                <p className="truncate text-[14px] text-muted">{benefit.business.name}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
