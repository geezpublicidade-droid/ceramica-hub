import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FadeUp } from "@/components/motion/FadeUp";
import { getUpcomingEvents } from "@/lib/services/events";
import { getActiveTowers } from "@/lib/services/towers";

type Block = {
  key: string;
  eyebrow: string;
  headline: string;
  cta: string;
  href: string;
  image?: string;
  objectPosition?: string;
  dark?: boolean;
};

/** "Eventos / Âncoras institucionais / O Complexo" -- três blocos grandes
 * lado a lado, cada um linkando pra uma página real (fórum de negócios,
 * parceiros, torre). Sem dado fictício: quando não há evento futuro
 * cadastrado, o bloco de Eventos cai no texto vazio em vez de inventar um
 * evento. */
export async function DestaqueBlocks() {
  const t = await getTranslations("DestaqueBlocks");
  const [events, towers] = await Promise.all([getUpcomingEvents(), getActiveTowers()]);

  const blocks: Block[] = [
    {
      key: "eventos",
      eyebrow: t("eventos.eyebrow"),
      headline: events.length > 0 ? t("eventos.headline") : t("eventos.headlineEmpty"),
      cta: t("eventos.cta"),
      href: "/forum-de-negocios",
      image: "/images/ceramica-hub-eventos.webp",
    },
    {
      key: "ancoras",
      eyebrow: t("ancoras.eyebrow"),
      headline: t("ancoras.headline"),
      cta: t("ancoras.cta"),
      href: "/parceiros",
      dark: true,
    },
    {
      key: "complexo",
      eyebrow: t("complexo.eyebrow"),
      headline: t("complexo.headline"),
      cta: t("complexo.cta"),
      href: towers.length > 0 ? `/torres/${towers[0].slug}` : "/",
      image: "/images/ceramica-hub-hero.webp",
      objectPosition: "50% 30%",
    },
  ];

  return (
    <section id="complexo" className="section-pad-y bg-surface">
      <div className="container-page grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-3">
        {blocks.map((block, index) => (
          <FadeUp key={block.key} delay={index * 0.1}>
            <Link
              href={block.href}
              className={`group relative flex h-[280px] flex-col justify-end overflow-hidden p-8 shadow-none transition-shadow duration-300 hover:shadow-[0_24px_48px_-20px_rgba(0,0,0,0.35)] sm:h-[300px] ${
                block.dark ? "bg-primary" : ""
              }`}
            >
              {block.dark ? (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-[0.15]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(135deg, transparent 0 22px, rgba(255,255,255,0.6) 22px 23px)",
                  }}
                />
              ) : (
                block.image && (
                  <>
                    <Image
                      src={block.image}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 33vw, 100vw"
                      style={{ objectPosition: block.objectPosition ?? "center" }}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  </>
                )
              )}
              <div className="relative">
                <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-white/75">
                  {block.eyebrow}
                </p>
                <h3 className="mt-2 text-[clamp(1.4rem,2.4vw,1.85rem)] font-semibold leading-tight tracking-tight text-white">
                  {block.headline}
                </h3>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-white transition-transform group-hover:translate-x-1">
                  {block.cta}
                  <span aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}
