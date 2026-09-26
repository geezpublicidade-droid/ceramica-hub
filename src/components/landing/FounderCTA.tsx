import { getTranslations } from "next-intl/server";
import { FadeUp } from "@/components/motion/FadeUp";
import { Link } from "@/i18n/navigation";

export async function FounderCTA() {
  const t = await getTranslations("FounderCTA");

  return (
    <section id="cadastro" className="section-pad-y bg-surface text-foreground">
      <div className="container-page max-w-4xl text-center">
        <FadeUp className="text-[15px] font-medium uppercase tracking-[0.2em] text-primary">
          {t("eyebrow")}
        </FadeUp>
        <FadeUp
          delay={0.05}
          className="mx-auto mt-5 max-w-2xl text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-tight tracking-tight"
        >
          {t("headline")}
        </FadeUp>
        <FadeUp delay={0.1} className="mx-auto mt-6 max-w-md text-[17px] leading-relaxed text-muted">
          {t("subhead")}
        </FadeUp>

        <FadeUp delay={0.15} className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/cadastro"
            className="neu-primary rounded-full px-8 py-4 text-[17px] font-medium text-white"
          >
            {t("ctaRegister")}
          </Link>
          <Link href="/planos" className="neu rounded-full px-8 py-4 text-[17px] font-medium text-foreground">
            {t("ctaKnowPlatform")}
          </Link>
        </FadeUp>
      </div>
    </section>
  );
}
