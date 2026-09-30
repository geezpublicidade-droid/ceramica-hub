import { computeTotals, type Proposal } from "@/lib/services/proposals";
import { formatCents, formatDateBR } from "@/lib/utils";

const PERIOD_SUFFIX: Record<string, string> = {
  mensal: "/mês",
  anual: "/ano",
  unico: "",
  personalizado: "",
};

/** Documento da proposta: mesmo layout na pré-visualização do admin e no
 * link público (que o cliente imprime/salva em PDF). */
export function ProposalDocument({ proposal }: { proposal: Proposal }) {
  const totals = computeTotals(proposal.items, proposal.discountPercent, proposal.discountCents);

  return (
    <article className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-white p-8 text-foreground print:border-0 print:p-0">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-muted">Cerâmica Hub</p>
          <h1 className="mt-1 text-2xl font-semibold">Proposta comercial nº {proposal.number}</h1>
        </div>
        <div className="text-right text-[14px] text-muted">
          <p>Emitida em {new Date(proposal.createdAt).toLocaleDateString("pt-BR")}</p>
          {proposal.validUntil && <p>Válida até {formatDateBR(proposal.validUntil)}</p>}
        </div>
      </header>

      <section className="py-6">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Cliente</p>
        <p className="text-[17px] font-medium">{proposal.clientName}</p>
        {proposal.clientEmail && <p className="text-[14px] text-muted">{proposal.clientEmail}</p>}
      </section>

      <table className="w-full text-[15px]">
        <thead>
          <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-muted">
            <th className="py-2 font-semibold">Item</th>
            <th className="py-2 text-right font-semibold">Qtd</th>
            <th className="py-2 text-right font-semibold">Valor</th>
            <th className="py-2 text-right font-semibold">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {proposal.items.map((item) => (
            <tr key={item.id} className="border-b border-border/60">
              <td className="py-3">{item.name}</td>
              <td className="py-3 text-right">{item.quantity}</td>
              <td className="py-3 text-right">
                {formatCents(item.unitPriceCents)}
                <span className="text-muted">{PERIOD_SUFFIX[item.period]}</span>
              </td>
              <td className="py-3 text-right">{formatCents(item.unitPriceCents * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex flex-col items-end gap-1 text-[15px]">
        <p className="text-muted">Subtotal: {formatCents(totals.subtotalCents)}</p>
        {totals.discountTotalCents > 0 && <p className="text-muted">Desconto: − {formatCents(totals.discountTotalCents)}</p>}
        <p className="text-[20px] font-semibold">Total: {formatCents(totals.totalCents)}</p>
      </div>

      {proposal.terms && (
        <section className="mt-8 border-t border-border pt-6">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Condições comerciais</p>
          <p className="mt-1 whitespace-pre-line text-[15px]">{proposal.terms}</p>
        </section>
      )}
    </article>
  );
}
