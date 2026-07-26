"use client";

import { useState, useTransition } from "react";
import { createPaymentLink } from "@/lib/actions/billing";
import { planLabels } from "@/data/businesses";
import { PLAN_PRICES_CENTS, type PayablePlan } from "@/lib/plan-limits";
import type { OwnedInvoice } from "@/lib/services/platform";

const PAYABLE_PLANS: PayablePlan[] = ["profissional", "destaque", "experiencia"];

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const INVOICE_STATUS_LABEL: Record<OwnedInvoice["status"], string> = {
  pending: "Aguardando pagamento",
  paid: "Pago",
  canceled: "Cancelado",
};

export function PlanBilling({
  currentPlan,
  invoices,
}: {
  currentPlan: string;
  invoices: OwnedInvoice[];
}) {
  const [isPending, startTransition] = useTransition();
  const [pendingPlan, setPendingPlan] = useState<PayablePlan | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleChoosePlan(plan: PayablePlan) {
    setPendingPlan(plan);
    setMessage(null);
    startTransition(async () => {
      const result = await createPaymentLink(plan);
      if (!result.success) {
        setMessage(result.error);
        setPendingPlan(null);
        return;
      }
      if (result.paymentLink) {
        window.open(result.paymentLink, "_blank", "noopener,noreferrer");
        setMessage("Fatura criada — pague pelo link que abriu em outra aba. Depois de pagar, nossa equipe confirma manualmente e seu plano é ativado.");
      } else {
        setMessage("Fatura criada, mas o link de pagamento ainda não está disponível. Fale com a gente pelo suporte pra concluir o pagamento.");
      }
      setPendingPlan(null);
    });
  }

  const pendingInvoices = invoices.filter((invoice) => invoice.status === "pending");

  return (
    <div className="glass-light rounded-3xl p-6">
      <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-muted">Plano e cobrança</p>

      {pendingInvoices.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {pendingInvoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-2.5 text-[13px]">
              <span>
                Plano {planLabels[invoice.plan]} — {formatCents(invoice.amountCents)} — {INVOICE_STATUS_LABEL[invoice.status]}
              </span>
              {invoice.paymentLink && (
                <a href={invoice.paymentLink} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline">
                  Pagar
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {PAYABLE_PLANS.map((plan) => (
          <button
            key={plan}
            type="button"
            disabled={isPending || currentPlan === plan}
            onClick={() => handleChoosePlan(plan)}
            className="neu rounded-xl px-4 py-3 text-left text-[13px] font-medium text-foreground disabled:opacity-50"
          >
            <span className="block">{planLabels[plan]}</span>
            <span className="mt-1 block text-[12px] font-normal text-muted">
              {formatCents(PLAN_PRICES_CENTS[plan])}/mês
              {currentPlan === plan ? " — plano atual" : ""}
            </span>
            {pendingPlan === plan && isPending && <span className="mt-1 block text-[11px] text-primary">Gerando fatura...</span>}
          </button>
        ))}
      </div>

      {message && <p className="mt-4 rounded-xl bg-primary/5 px-4 py-3 text-[13px] text-foreground">{message}</p>}
    </div>
  );
}
