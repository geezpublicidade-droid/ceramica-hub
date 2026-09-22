import { MapPin, Navigation, MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Tower } from "@/lib/services/towers";

type UtilityStripProps = {
  towers: Tower[];
};

function mapsSearchUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function mapsDirectionsUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

/** Faixa compacta antes do rodapé -- mapa/como chegar/fale conosco usam o
 * endereço real da primeira torre ativa (mesmo dado de src/lib/services/
 * towers.ts) em vez de um endereço inventado. */
export async function UtilityStrip({ towers }: UtilityStripProps) {
  const [t, tFounder] = await Promise.all([
    getTranslations("UtilityStrip"),
    getTranslations("FounderCTA"),
  ]);

  const reference = towers[0];
  const address = reference ? `${reference.address}, São Caetano do Sul - SP, ${reference.cep}` : null;

  return (
    <section className="border-t border-border bg-white">
      <div className="container-page grid grid-cols-1 gap-6 py-[var(--space-lg)] sm:grid-cols-4 sm:items-center sm:gap-4">
        {address && (
          <a
            href={mapsSearchUrl(address)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3"
          >
            <MapPin aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
            <span>
              <span className="block text-[15px] font-medium text-foreground">{t("mapaLabel")}</span>
              <span className="text-[13px] text-muted transition-transform group-hover:translate-x-1">
                {t("mapaCta")} →
              </span>
            </span>
          </a>
        )}

        {address && (
          <a
            href={mapsDirectionsUrl(address)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3"
          >
            <Navigation aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
            <span>
              <span className="block text-[15px] font-medium text-foreground">{t("comoChegarLabel")}</span>
              <span className="text-[13px] text-muted transition-transform group-hover:translate-x-1">
                {t("comoChegarCta")} →
              </span>
            </span>
          </a>
        )}

        <Link href="/contato" className="group flex items-center gap-3">
          <MessageCircle aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
          <span>
            <span className="block text-[15px] font-medium text-foreground">{t("faleConoscoLabel")}</span>
            <span className="text-[13px] text-muted transition-transform group-hover:translate-x-1">
              {t("faleConoscoCta")} →
            </span>
          </span>
        </Link>

        <Link
          href="/cadastro"
          className="flex flex-col justify-center rounded-2xl bg-primary/10 px-6 py-5 text-foreground transition-colors hover:bg-primary/15"
        >
          <span className="text-[13px] font-medium uppercase tracking-[0.12em] text-primary">
            {tFounder("eyebrow")}
          </span>
          <span className="mt-1 text-[16px] font-semibold leading-snug tracking-tight">
            {tFounder("ctaRegister")} →
          </span>
        </Link>
      </div>
    </section>
  );
}
