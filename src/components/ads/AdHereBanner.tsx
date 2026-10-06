import { ArrowRight, Megaphone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { openSlotBackground } from "@/components/categoria/open-slot";

type AdHereBannerProps = {
  /** destino do botão; padrão: página de planos */
  href?: string;
  /** assunto no texto, ex.: nome da categoria (opcional) */
  topic?: string;
  /** alterna a cor de fundo entre banners da mesma página */
  tone?: number;
  /** sem o container/respiro de fim de página: para encaixar no meio de uma seção que já tem largura própria */
  inline?: boolean;
};

/** Faixa larga de espaço publicitário livre: cor da marca + "Anuncie aqui", leva à página de planos. */
export async function AdHereBanner({ href = "/planos", topic, tone = 0, inline = false }: AdHereBannerProps) {
  const t = await getTranslations("AdHere");

  return (
    <section aria-label={t("eyebrow")} data-reveal className={inline ? "my-10" : "container-page pb-16 pt-6 sm:pb-20"}>
      <Link
        href={href}
        className="group lift relative flex flex-col items-start gap-5 overflow-hidden rounded-3xl px-6 py-8 text-white sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-10 sm:py-10"
        style={openSlotBackground(tone)}
      >
        <div className="flex items-start gap-4">
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 sm:flex">
            <Megaphone aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-white/80">{t("eyebrow")}</p>
            <p className="mt-1 text-[clamp(1.6rem,3.4vw,2.4rem)] font-semibold leading-tight tracking-tight">{t("title")}</p>
            <p className="mt-2 max-w-xl text-[15px] leading-snug text-white/85">
              {topic ? t("textTopic", { topic }) : t("text")}
            </p>
          </div>
        </div>
        <span className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-white px-6 text-[16px] font-medium text-foreground">
          {t("cta")}
          <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </Link>
    </section>
  );
}
