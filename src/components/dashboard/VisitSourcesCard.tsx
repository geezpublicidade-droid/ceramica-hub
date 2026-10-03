import type { VisitSource } from "@/lib/services/business-results";

const SOURCE_LABEL: Record<string, string> = {
  direto: "Direto, busca no site ou indicação",
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  google: "Google",
  linkedin: "LinkedIn",
  email: "E-mail",
  impresso: "Materiais impressos (QR Code)",
  link_copiado: "Link copiado e compartilhado",
};

function labelFor(source: string): string {
  return SOURCE_LABEL[source] ?? source.charAt(0).toUpperCase() + source.slice(1);
}

/** Origem das visitas à página no período, com barras proporcionais. Nada inventado: sem visita, não aparece. */
export function VisitSourcesCard({ sources, periodLabel }: { sources: VisitSource[]; periodLabel: string }) {
  const total = sources.reduce((sum, item) => sum + item.visits, 0);
  if (total === 0) return null;
  const top = sources[0].visits;

  return (
    <section className="glass-light rounded-3xl p-6">
      <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">De onde vêm as visitas</p>
      <p className="mt-1 text-[14px] text-muted">{periodLabel} · use os links rastreados da aba Divulgação para ver cada canal.</p>
      <ul className="mt-5 flex flex-col gap-3">
        {sources.map((item) => (
          <li key={item.source}>
            <div className="flex items-baseline justify-between gap-3 text-[15px]">
              <span className="text-foreground">{labelFor(item.source)}</span>
              <span className="font-semibold text-foreground">
                {item.visits} <span className="text-[13px] font-normal text-muted">({Math.round((item.visits / total) * 100)}%)</span>
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/5">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, (item.visits / top) * 100)}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
