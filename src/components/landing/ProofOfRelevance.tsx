import { getTranslations } from "next-intl/server";
import { FadeUp } from "@/components/motion/FadeUp";
import type { HomeProofStats } from "@/lib/services/platform";

type ProofOfRelevanceProps = {
  stats: HomeProofStats;
};

/** Números reais, sem estimativa (ver getHomeProofStats em platform.ts) --
 * função é gerar autoridade nos primeiros segundos de scroll, antes de
 * qualquer venda. Tiles simples, sem glass/sombra, pra não competir com o
 * hero logo acima. */
export async function ProofOfRelevance({ stats }: ProofOfRelevanceProps) {
  const t = await getTranslations("ProofOfRelevance");

  const tiles = [
    { value: stats.empresasVerificadas, label: t("empresasVerificadas") },
    { value: stats.categorias, label: t("categorias") },
    { value: stats.torres, label: t("torres") },
    { value: stats.ofertas, label: t("ofertas") },
    { value: stats.contatosGerados, label: t("contatosGerados") },
  ];

  return (
    <section className="border-y border-border bg-surface py-[var(--space-xl)]">
      <div className="container-page grid grid-cols-2 gap-8 sm:grid-cols-5 sm:gap-6">
        {tiles.map((tile) => (
          <FadeUp key={tile.label} className="text-center sm:text-left">
            <p className="text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-none tracking-tight text-foreground">
              {tile.value}
            </p>
            <p className="mt-2 text-[14px] leading-snug text-muted">{tile.label}</p>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}
