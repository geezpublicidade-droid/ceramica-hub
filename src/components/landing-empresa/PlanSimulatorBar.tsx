import { planLabels, type Business } from "@/data/businesses";

const PLANS: Business["plan"][] = ["presenca", "profissional", "destaque", "experiencia", "premium"];

type PlanSimulatorBarProps = {
  /** caminho do preview, sem query */
  basePath: string;
  realPlan: Business["plan"];
  simulatedPlan: Business["plan"] | null;
  demo: boolean;
  draft: boolean;
};

function href(basePath: string, plan: Business["plan"] | null, demo: boolean): string {
  const params = new URLSearchParams();
  if (plan) params.set("plano", plan);
  if (demo) params.set("exemplo", "1");
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

const chip = (active: boolean) =>
  `rounded-full px-3 py-1 text-[12.5px] font-semibold transition ${active ? "bg-white text-foreground" : "bg-white/10 text-white hover:bg-white/20"}`;

/** Barra fixa do preview: escolhe o plano simulado e liga/desliga o conteúdo de exemplo. Nada aqui é gravado. */
export function PlanSimulatorBar({ basePath, realPlan, simulatedPlan, demo, draft }: PlanSimulatorBarProps) {
  const active = simulatedPlan ?? realPlan;
  return (
    <div className="fixed inset-x-0 top-[72px] z-30 bg-foreground px-4 py-2 text-white">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-4 gap-y-1.5">
        <p className="text-[12.5px] font-medium text-white/80">
          Pré-visualização{draft ? " (rascunho)" : ""} · plano {simulatedPlan ? "simulado" : "atual"}: <strong className="text-white">{planLabels[active]}</strong>
          {demo ? " · com conteúdo de exemplo" : ""}
        </p>
        <nav aria-label="Simular plano" className="flex flex-wrap items-center gap-1.5">
          <a href={href(basePath, null, demo)} className={chip(simulatedPlan === null)}>
            Plano atual
          </a>
          {PLANS.map((plan) => (
            <a key={plan} href={href(basePath, plan, demo)} className={chip(simulatedPlan === plan)}>
              {planLabels[plan]}
            </a>
          ))}
        </nav>
        <a href={href(basePath, simulatedPlan, !demo)} className={`${chip(demo)} ml-auto`}>
          {demo ? "✓ Conteúdo de exemplo" : "Mostrar conteúdo de exemplo"}
        </a>
      </div>
    </div>
  );
}
