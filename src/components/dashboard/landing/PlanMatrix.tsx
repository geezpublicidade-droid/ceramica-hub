"use client";

import { usePlanLadder } from "@/components/plans/PlanProvider";
import { landingCapabilitiesFromFeatures, type LandingCapabilities } from "@/lib/landing/sections";
import type { PlanKey } from "@/lib/plans/features";

type Row = { label: string; value: (c: LandingCapabilities) => string | boolean };

const count = (n: number, unit: string) => (n === 0 ? false : Number.isFinite(n) ? `${n} ${unit}` : "Ilimitados");

const ROWS: Row[] = [
  { label: "Perfil comercial padronizado", value: (c) => c.layout !== "basic" },
  { label: "Landing page personalizada (hero, seções, CTAs)", value: (c) => c.customCover },
  { label: "Serviços / produtos", value: (c) => count(c.maxServices, "serviços") },
  { label: "Galeria de fotos", value: (c) => count(c.maxGalleryItems, "fotos") },
  { label: "Promoções ativas", value: (c) => count(c.maxPromotions, "promoções") },
  { label: "Cupons rastreáveis", value: (c) => c.trackableCoupons },
  { label: "Vídeo em destaque", value: (c) => c.video },
  { label: "Perguntas frequentes (FAQ)", value: (c) => c.faq },
  { label: "Formulário de pedido de contato", value: (c) => c.leadForm },
  { label: "Tour virtual 3D", value: (c) => c.virtualTour },
  { label: "Métricas da página", value: (c) => ({ none: false, summary: "Resumo", basic: "Básicas", full: "Completas", premium: "Premium", campaign: "Campanhas" })[c.metrics] },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <span className="font-semibold text-whatsapp" aria-label="Incluído">✓</span>;
  if (value === false) return <span className="text-muted" aria-label="Não incluído">—</span>;
  return <span className="font-medium text-foreground">{value}</span>;
}

/** Quadro comparativo montado do catálogo de planos (nunca desatualiza), com atalho para simular cada um na pré-visualização. */
export function PlanMatrix({ currentPlan, previewHref }: { currentPlan: PlanKey; previewHref: string }) {
  const ladder = usePlanLadder();
  return (
    <details className="mt-5 rounded-lg border border-border bg-white">
      <summary className="cursor-pointer px-4 py-3 text-[14px] font-semibold text-foreground">Comparar planos e simular como a página ficaria</summary>
      <div className="overflow-x-auto px-4 pb-4">
        <table className="w-full min-w-[640px] border-collapse text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-3 font-medium text-muted">Recurso da página</th>
              {ladder.map((plan) => (
                <th key={plan.key} scope="col" className={`px-2 py-2 text-center ${plan.key === currentPlan ? "bg-primary/5" : ""}`}>
                  <span className="block font-semibold">{plan.name}</span>
                  {plan.key === currentPlan && <span className="block text-[11px] font-medium text-primary">plano em vigor</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-b border-border/60">
                <th scope="row" className="py-2 pr-3 font-normal text-foreground/80">
                  {row.label}
                </th>
                {ladder.map((plan) => (
                  <td key={plan.key} className={`px-2 py-2 text-center ${plan.key === currentPlan ? "bg-primary/5" : ""}`}>
                    <Cell value={row.value(landingCapabilitiesFromFeatures(plan.features))} />
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row" className="py-3 pr-3 font-normal text-foreground/80">
                Ver como ficaria
              </th>
              {ladder.map((plan) => (
                <td key={plan.key} className={`px-2 py-3 text-center ${plan.key === currentPlan ? "bg-primary/5" : ""}`}>
                  <a href={`${previewHref}?plano=${plan.key}&exemplo=1`} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
                    Simular
                  </a>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <p className="mt-2 text-[12.5px] text-muted">A simulação completa o que a empresa ainda não preencheu com conteúdo de exemplo e não salva nada.</p>
      </div>
    </details>
  );
}
