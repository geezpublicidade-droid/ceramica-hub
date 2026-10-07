"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createPaymentLink } from "@/lib/actions/billing";
import { formatCents } from "@/lib/utils";
import type { OwnedInvoice } from "@/lib/services/platform";

export type BillablePlan = { key: string; name: string; priceCents: number };

const INVOICE_STATUS_LABEL: Record<OwnedInvoice["status"], string> = {
  pending: "Aguardando pagamento",
  paid: "Pago",
  canceled: "Cancelado",
};

/** Contratação/renovação: planos e preços vêm do catálogo (admin), com o desconto negociado da empresa já aplicado. */
export function PlanBilling({
  currentPlan,
  invoices,
  plans,
  discountPercent,
  planNames,
}: {
  currentPlan: string;
  invoices: OwnedInvoice[];
  plans: BillablePlan[];
  discountPercent?: number | null;
  planNames: Record<string, string>;
}) {
  const [isPending, startTransition] = useTransition();
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const discount = discountPercent ?? 0;

  function handleChoosePlan(plan: string) {
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
        setMessage("Fatura criada — pague pelo link que abriu em outra aba. Assim que o pagamento for confirmado, o plano é ativado automaticamente.");
      } else {
        setMessage("Fatura criada, mas o link de pagamento ainda não está disponível. Fale com a gente pelo suporte pra concluir o pagamento.");
      }
      setPendingPlan(null);
    });
  }

  const pendingInvoices = invoices.filter((invoice) => invoice.status === "pending");

  return (
    <div className="glass-light rounded-3xl p-6">
      <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">Contratar ou renovar</p>

      {pendingInvoices.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {pendingInvoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-2.5 text-[15px]">
              <span>
                Plano {planNames[invoice.plan] ?? invoice.plan} — {formatCents(invoice.amountCents)} — {INVOICE_STATUS_LABEL[invoice.status]}
              </span>
              {invoice.paymentLink && (
                <a href={invoice.paymentLink} target="_blank" rel="noopener noreferrer" className="tap font-medium text-primary underline">
                  Pagar
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const price = Math.round(plan.priceCents * (1 - discount / 100));
          return (
            <div key={plan.key} className="neu rounded-xl p-1">
              <button
                type="button"
                disabled={isPending || currentPlan === plan.key}
                onClick={() => handleChoosePlan(plan.key)}
                className="w-full rounded-lg px-3 py-2.5 text-left text-[15px] font-medium text-foreground disabled:opacity-50"
              >
                <span className="block">{plan.name}</span>
                <span className="mt-1 block text-[14px] font-normal text-muted">
                  {discount > 0 && <span className="mr-1.5 line-through">{formatCents(plan.priceCents)}</span>}
                  {formatCents(price)}/mês
                  {currentPlan === plan.key ? " — plano atual" : ""}
                </span>
                {pendingPlan === plan.key && isPending && <span className="mt-1 block text-[13px] text-primary">Gerando fatura...</span>}
              </button>
              <Link href={`/planos/${plan.key}`} target="_blank" className="block px-3 pb-2 text-[13px] font-medium text-primary hover:underline">
                Ver detalhes →
              </Link>
            </div>
          );
        })}
      </div>

      {message && <p className="mt-4 rounded-xl bg-primary/5 px-4 py-3 text-[15px] text-foreground">{message}</p>}
    </div>
  );
}
