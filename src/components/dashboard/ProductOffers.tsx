"use client";

import { useState, useTransition } from "react";
import { requestActionAction } from "@/lib/actions/action-requests";

export type OfferItem = { slug: string; name: string; description: string | null; priceLabel: string };

/** Catálogo de visibilidade extra para a empresa: preço do /admin/produtos e
 * botão que abre um chamado de suporte (a equipe fecha a contratação). */
export function ProductOffers({ offers }: { offers: OfferItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  function request(offer: OfferItem) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await requestActionAction({
          type: "contratar_produto",
          message: `Tenho interesse em contratar: ${offer.name} (${offer.priceLabel}).`,
        });
        if (result.success) setSent((current) => ({ ...current, [offer.slug]: true }));
        else setError(result.error);
      } catch {
        setError("Não foi possível enviar agora. Tente de novo.");
      }
    });
  }

  if (offers.length === 0) return null;
  return (
    <section className="glass-card-light rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-foreground">Contratar mais visibilidade</h2>
      <p className="mt-1 text-[15px] text-muted">Quer aparecer mais? Escolha uma opção e nossa equipe retorna pelo Suporte para fechar com você.</p>
      <ul className="mt-5 divide-y divide-border">
        {offers.map((offer) => (
          <li key={offer.slug} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="min-w-0">
              <p className="text-[16px] font-medium text-foreground">{offer.name}</p>
              {offer.description && <p className="text-[14px] text-muted">{offer.description}</p>}
              <p className="mt-1 text-[14px] font-semibold text-primary">{offer.priceLabel}</p>
            </div>
            {sent[offer.slug] ? (
              <p className="text-[14px] text-emerald-700">Pedido enviado!</p>
            ) : (
              <button
                type="button"
                disabled={isPending}
                onClick={() => request(offer)}
                className="neu-primary rounded-full px-5 py-2.5 text-[14px] font-medium text-white disabled:opacity-60"
              >
                Tenho interesse
              </button>
            )}
          </li>
        ))}
      </ul>
      {error && <p className="mt-3 text-[14px] text-red-700">{error}</p>}
    </section>
  );
}
