"use client";

import { useState, useTransition } from "react";
import { updatePublicationProduct } from "@/lib/actions/admin-publications";

type Props = { id: string; name: string; priceCents: number; capacityPerSlot: number; active: boolean };

/** Preço (em reais), vagas por horário e liga/desliga de um produto de publicação. */
export function PublicationProductForm({ id, name, priceCents, capacityPerSlot, active }: Props) {
  const [isPending, startTransition] = useTransition();
  const [price, setPrice] = useState(String(priceCents / 100));
  const [capacity, setCapacity] = useState(String(capacityPerSlot));
  const [isActive, setIsActive] = useState(active);
  const [message, setMessage] = useState<string | null>(null);

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await updatePublicationProduct(id, {
        priceCents: Math.round(Number(price.replace(",", ".")) * 100),
        capacityPerSlot: Number(capacity),
        active: isActive,
      }).catch(() => ({ success: false as const, error: "Falha de conexão." }));
      setMessage(result.success ? "Salvo." : result.error);
    });
  }

  const field = "w-24 rounded-lg border border-border bg-white px-2 py-1.5 text-[14px]";
  return (
    <li className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-white/80 p-4">
      <p className="min-w-[200px] flex-1 text-[15px] font-semibold text-foreground">{name}</p>
      <label className="text-[12px] text-muted">Preço (R$)<input value={price} onChange={(e) => setPrice(e.target.value)} className={`${field} block`} /></label>
      <label className="text-[12px] text-muted">Vagas/horário<input value={capacity} onChange={(e) => setCapacity(e.target.value)} className={`${field} block`} /></label>
      <label className="flex items-center gap-2 text-[13px] text-foreground"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />À venda</label>
      <button type="button" disabled={isPending} onClick={save} className="neu-primary rounded-full px-4 py-2 text-[13px] font-medium text-white disabled:opacity-60">Salvar</button>
      {message && <span className="text-[13px] text-muted">{message}</span>}
    </li>
  );
}
