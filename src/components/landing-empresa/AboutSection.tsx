import { getTranslations } from "next-intl/server";
import { EYEBROW, SECTION_TITLE, type LandingContext } from "./context";

/** Apresentação curta: problema que resolve, benefício, diferenciais e público. Some se nada foi preenchido. */
export async function AboutSection({ ctx }: { ctx: LandingContext }) {
  const { config } = ctx.data;
  const hasContent = config.aboutProblem || config.aboutBenefit || config.aboutAudience || config.aboutDifferentials.length > 0;
  if (!hasContent) return null;

  const t = await getTranslations("LandingEmpresa");
  const blocks = [
    { label: t("aboutProblem"), text: config.aboutProblem },
    { label: t("aboutBenefit"), text: config.aboutBenefit },
    { label: t("aboutAudience"), text: config.aboutAudience },
  ].filter((block): block is { label: string; text: string } => Boolean(block.text));

  return (
    <section id="sobre" className="container-page py-12 sm:py-16">
      <p className={EYEBROW}>{t("aboutEyebrow")}</p>
      <h2 className={`mt-2 ${SECTION_TITLE}`}>{ctx.business.name}</h2>
      <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {blocks.map((block) => (
          <div key={block.label}>
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-foreground">{block.label}</h3>
            <p className="mt-2 text-[16px] leading-relaxed text-foreground/75">{block.text}</p>
          </div>
        ))}
        {config.aboutDifferentials.length > 0 && (
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-foreground">{t("aboutDifferentials")}</h3>
            <ul className="mt-2 space-y-1.5 text-[16px] leading-relaxed text-foreground/75">
              {config.aboutDifferentials.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
