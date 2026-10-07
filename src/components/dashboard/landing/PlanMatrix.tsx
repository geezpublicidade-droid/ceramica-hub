import { planLabels, type Business } from "@/data/businesses";
import { landingCapabilitiesFor, type LandingCapabilities } from "@/lib/landing/sections";

const PLANS: Business["plan"][] = ["presenca", "profissional", "destaque", "experiencia", "premium"];

type Row = { label: string; value: (c: LandingCapabilities) => string | boolean };

const count = (n: number, unit: string) => (n === 0 ? false : Number.isFinite(n) ? `${n} ${unit}` : "Ilimitados");

const ROWS: Row[] = [
  { label: "Capa e imagem do hero personalizadas", value: (c) => c.customCover },
  { label: "Serviços / produtos", value: (c) => count(c.maxServices, "serviços") },
  { label: "Galeria de fotos", value: (c) => count(c.maxGalleryItems, "fotos") },
  { label: "Vídeos", value: (c) => c.video },
  { label: "Tour virtual 3D", value: (c) => c.virtualTour },
  { label: "Perguntas frequentes (FAQ)", value: (c) => c.faq },
  { label: "Oferta exclusiva com cupom", value: (c) => c.offer },
  { label: "Formulário de pedido de contato", value: (c) => c.leadForm },
  { label: "Métricas da página", value: (c) => (c.metrics === "none" ? false : c.metrics === "basic" ? "Básicas" : "Completas") },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <span className="font-semibold text-whatsapp" aria-label="Incluído">✓</span>;
  if (value === false) return <span className="text-muted" aria-label="Não incluído">—</span>;
  return <span className="font-medium text-foreground">{value}</span>;
}

/** Quadro comparativo do que a landing mostra em cada plano, com atalho para simular cada um na pré-visualização. */
export function PlanMatrix({ currentPlan, previewHref }: { currentPlan: Business["plan"]; previewHref: string }) {
  return (
    <details className="mt-5 rounded-lg border border-border bg-white">
      <summary className="cursor-pointer px-4 py-3 text-[14px] font-semibold text-foreground">Comparar planos e simular como a página ficaria</summary>
      <div className="overflow-x-auto px-4 pb-4">
        <table className="w-full min-w-[640px] border-collapse text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-3 font-medium text-muted">Recurso da landing</th>
              {PLANS.map((plan) => (
                <th key={plan} scope="col" className={`px-2 py-2 text-center ${plan === currentPlan ? "bg-primary/5" : ""}`}>
                  <span className="block font-semibold">{planLabels[plan]}</span>
                  {plan === currentPlan && <span className="block text-[11px] font-medium text-primary">plano atual</span>}
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
                {PLANS.map((plan) => (
                  <td key={plan} className={`px-2 py-2 text-center ${plan === currentPlan ? "bg-primary/5" : ""}`}>
                    <Cell value={row.value(landingCapabilitiesFor(plan))} />
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row" className="py-3 pr-3 font-normal text-foreground/80">
                Ver como ficaria
              </th>
              {PLANS.map((plan) => (
                <td key={plan} className={`px-2 py-3 text-center ${plan === currentPlan ? "bg-primary/5" : ""}`}>
                  <a href={`${previewHref}?plano=${plan}&exemplo=1`} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
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
