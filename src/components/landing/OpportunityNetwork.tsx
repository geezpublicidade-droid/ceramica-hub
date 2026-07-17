import { FadeUp } from "@/components/motion/FadeUp";
import { opportunityTypeLabels } from "@/data/opportunities";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { OpportunityWithBusiness } from "@/lib/services/platform";

type OpportunityNetworkProps = {
  opportunities: OpportunityWithBusiness[];
};

const typeStyles: Record<string, string> = {
  procura: "bg-connection/15 text-primary",
  oferece: "bg-primary-light/15 text-primary",
  contratando: "bg-foreground/10 text-foreground",
  parceria: "bg-primary/15 text-primary",
};

export function OpportunityNetwork({ opportunities }: OpportunityNetworkProps) {
  return (
    <section id="oportunidades" className="bg-surface px-6 py-28 text-foreground">
      <div className="mx-auto max-w-6xl">
        <FadeUp className="max-w-2xl">
          <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-primary">
            Rede em movimento
          </p>
          <h2 className="mt-4 text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-tight tracking-tight">
            Mais do que encontrar empresas. Encontre oportunidades.
          </h2>
        </FadeUp>

        <FadeUp
          delay={0.1}
          className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {opportunities.map((opportunity) => (
            <div
              key={opportunity.id}
              className="glass-card-light w-[280px] shrink-0 snap-start rounded-2xl p-6"
            >
              <span
                className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  typeStyles[opportunity.type] ?? "bg-foreground/10 text-muted"
                }`}
              >
                {opportunityTypeLabels[opportunity.type]}
              </span>
              <p className="mt-4 text-[15px] font-semibold leading-snug tracking-tight">
                {opportunity.title}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{opportunity.description}</p>

              <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-[10px] font-semibold">
                  {opportunity.business.initials}
                </div>
                <p className="truncate text-[12px] text-muted">{opportunity.business.name}</p>
              </div>

              <a
                href={buildWhatsAppLink(
                  opportunity.business.phone,
                  `${opportunity.business.name} (sobre: ${opportunity.title})`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-primary"
              >
                Conversar sobre isso
                <span aria-hidden="true">→</span>
              </a>
            </div>
          ))}
        </FadeUp>
      </div>
    </section>
  );
}
