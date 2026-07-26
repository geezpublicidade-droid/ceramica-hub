"use client";

import { useTransition } from "react";
import { confirmInvoicePayment } from "@/lib/actions/admin-billing";
import { planLabels } from "@/data/businesses";
import type { PendingInvoice } from "@/lib/services/platform";

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function AdminInvoiceRow({ invoice }: { invoice: PendingInvoice }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white/70 p-5">
      <div>
        <p className="text-[15px] font-semibold text-foreground">{invoice.businessName}</p>
        <p className="text-[13px] text-muted">
          Plano {planLabels[invoice.plan]} — {formatCents(invoice.amountCents)}
        </p>
        {invoice.paymentLink && (
          <a href={invoice.paymentLink} target="_blank" rel="noopener noreferrer" className="text-[13px] text-primary underline">
            Ver link de pagamento
          </a>
        )}
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(() => {
            void confirmInvoicePayment(invoice.id);
          })
        }
        className="neu-primary rounded-full px-4 py-2 text-[13px] font-medium text-white disabled:opacity-60"
      >
        Confirmar pagamento
      </button>
    </div>
  );
}
