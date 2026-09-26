import { getTranslations } from "next-intl/server";
import { FadeUp } from "@/components/motion/FadeUp";

/** Texto institucional curto -- fecha a parte editorial da home antes do bloco funcional. */
export async function InstitutionalStatement() {
  const t = await getTranslations("InstitutionalStatement");

  return (
    <section className="section-pad-y bg-surface">
      <FadeUp className="container-page max-w-3xl text-center">
        <p className="text-[clamp(1.25rem,2.4vw,1.75rem)] font-medium leading-relaxed tracking-tight text-foreground">
          {t("text")}
        </p>
      </FadeUp>
    </section>
  );
}
