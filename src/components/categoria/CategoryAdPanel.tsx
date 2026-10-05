import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

type CategoryAdPanelProps = {
  eyebrow: string;
  text: string;
  ctaLabel: string;
  ctaHref: string;
};

const CTA_CLASS =
  "inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-[16px] font-medium text-foreground transition-colors hover:bg-white/90";

/** Cota principal da categoria: painel terracota ao lado do hero (abaixo da imagem no celular). */
export function CategoryAdPanel({ eyebrow, text, ctaLabel, ctaHref }: CategoryAdPanelProps) {
  const external = /^https?:\/\//.test(ctaHref);
  const content = (
    <>
      {ctaLabel}
      <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
    </>
  );

  return (
    <aside
      aria-label={eyebrow}
      className="flex flex-col justify-center bg-primary px-6 py-10 text-white sm:px-[var(--page-padding)] lg:px-8 lg:py-12"
    >
      <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-white/80">{eyebrow}</p>
      <p className="mt-4 max-w-sm text-[clamp(1.2rem,1.9vw,1.5rem)] font-medium leading-snug">{text}</p>
      <div className="mt-6">
        {external ? (
          <a href={ctaHref} target="_blank" rel="sponsored noopener noreferrer" className={CTA_CLASS}>
            {content}
          </a>
        ) : (
          <Link href={ctaHref} className={CTA_CLASS}>
            {content}
          </Link>
        )}
      </div>
    </aside>
  );
}
