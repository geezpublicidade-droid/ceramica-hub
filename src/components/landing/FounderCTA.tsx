import { getTranslations } from "next-intl/server";
import { FadeUp } from "@/components/motion/FadeUp";
import { Link } from "@/i18n/navigation";

export async function FounderCTA() {
  const t = await getTranslations("FounderCTA");
  const benefits = t.raw("benefits") as string[];

  return (
    <section id="cadastro" className="bg-surface px-6 py-20 text-foreground">
      <div className="mx-auto max-w-4xl text-center">
        <FadeUp className="text-[13px] font-medium uppercase tracking-[0.2em] text-primary">
          {t("eyebrow")}
        </FadeUp>
        <FadeUp
          delay={0.05}
          className="mx-auto mt-5 max-w-2xl text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-tight tracking-tight"
        >
          {t("headline")}
        </FadeUp>
        <FadeUp delay={0.1} className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-muted">
          {t("subhead")}
        </FadeUp>

        <FadeUp
          delay={0.15}
          className="glass-light mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-3 rounded-2xl p-6 text-left sm:grid-cols-2"
        >
          {benefits.map((benefit) => (
            <div key={benefit} className="flex items-start gap-2.5 text-[14px] text-foreground/80">
              <span aria-hidden="true" className="mt-0.5 text-primary">
                ✓
              </span>
              {benefit}
            </div>
          ))}
        </FadeUp>

        <FadeUp delay={0.2} className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/cadastro"
            className="neu-primary rounded-full px-8 py-4 text-[15px] font-medium text-white"
          >
            {t("ctaRegister")}
          </Link>
          <a href="#planos" className="neu rounded-full px-8 py-4 text-[15px] font-medium text-foreground">
            {t("ctaKnowPlatform")}
          </a>
        </FadeUp>
      </div>
    </section>
  );
}
