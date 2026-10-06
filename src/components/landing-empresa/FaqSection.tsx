import { ChevronDown } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SECTION_TITLE, type LandingContext } from "./context";

/** Perguntas frequentes em accordion (details/summary: funciona sem JavaScript). Cadastradas e ordenadas no painel. */
export async function FaqSection({ ctx }: { ctx: LandingContext }) {
  const { faqs } = ctx.data;
  if (faqs.length === 0) return null;

  const t = await getTranslations("LandingEmpresa");
  return (
    <section id="duvidas" className="container-page py-12 sm:py-16">
      <h2 className={`mb-6 ${SECTION_TITLE}`}>{t("faqTitle")}</h2>
      <div className="max-w-3xl divide-y divide-black/[0.08] rounded-md border border-black/[0.07] bg-white">
        {faqs.map((faq) => (
          <details key={faq.id} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15.5px] font-medium text-foreground [&::-webkit-details-marker]:hidden">
              {faq.question}
              <ChevronDown className="h-4 w-4 shrink-0 text-muted transition group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="px-5 pb-5 text-[15px] leading-relaxed text-foreground/75">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
