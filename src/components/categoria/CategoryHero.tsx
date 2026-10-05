import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

export type HeroCrumb = { name: string; href: string };

type CategoryHeroProps = {
  breadcrumb: HeroCrumb[];
  breadcrumbLabel: string;
  title: string;
  description: string;
  /** texto auxiliar pequeno abaixo da busca (opcional) */
  helper?: string | null;
  image: { desktop: string; mobile?: string | null; alt: string };
  /** campo de busca da categoria */
  search: ReactNode;
  /** cota comercial (CategoryAdPanel); ausente = a imagem ocupa a largura toda */
  adPanel?: ReactNode;
};

/**
 * Hero da categoria: ~72% foto + título + busca e ~28% painel comercial no desktop;
 * empilhado no celular. Sem `overflow-hidden` na seção para a lista de sugestões da
 * busca poder passar por cima do conteúdo seguinte.
 */
export function CategoryHero({ breadcrumb, breadcrumbLabel, title, description, helper, image, search, adPanel }: CategoryHeroProps) {
  const mobileSrc = image.mobile ?? image.desktop;

  return (
    <section className="relative isolate bg-graphite text-white">
      <div className="flex flex-col lg:min-h-[440px] lg:flex-row">
        <div className={`relative flex flex-1 flex-col justify-end px-5 pb-10 pt-28 sm:px-[var(--page-padding)] sm:pt-32 lg:pb-12 ${adPanel ? "lg:w-[72%] lg:flex-none" : ""}`}>
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <picture>
              <source media="(max-width: 639px)" srcSet={mobileSrc} />
              <img src={image.desktop} alt={image.alt} fetchPriority="high" decoding="async" className="h-full w-full object-cover" />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/25" />
          </div>

          <nav aria-label={breadcrumbLabel} className="text-[14px] text-white/80">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {breadcrumb.map((item, index) => (
                <li key={item.href} className="flex items-center gap-2">
                  {index < breadcrumb.length - 1 ? (
                    <Link href={item.href} className="inline-block py-1.5 hover:text-white">
                      {item.name}
                    </Link>
                  ) : (
                    <span aria-current="page" className="text-white">
                      {item.name}
                    </span>
                  )}
                  {index < breadcrumb.length - 1 && <span aria-hidden="true">&gt;</span>}
                </li>
              ))}
            </ol>
          </nav>

          <h1 className="mt-3 max-w-2xl text-[clamp(2rem,4.6vw,3.6rem)] font-semibold leading-[1.08] tracking-tight">{title}</h1>
          <p className="mt-4 max-w-xl text-[clamp(1rem,1.5vw,1.15rem)] leading-relaxed text-white/85">{description}</p>

          <div className="relative z-10 mt-6 max-w-2xl [&_.glass-card-light]:!bg-white [&_.glass-card-light]:!backdrop-blur-none">{search}</div>
          {helper && <p className="mt-3 max-w-xl text-[14px] text-white/75">{helper}</p>}
        </div>

        {adPanel && <div className="lg:w-[28%] lg:min-w-[260px] lg:shrink-0 [&>aside]:h-full">{adPanel}</div>}
      </div>
    </section>
  );
}
