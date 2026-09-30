"use client";

import { useState } from "react";
import { useAdminAction } from "@/components/admin/useAdminAction";
import { addAnchorStore, setStoreActive, deleteAnchorStore, setStoreHighlight } from "@/lib/actions/admin-anchors";
import { isStoreHighlighted, type AnchorStore } from "@/lib/services/anchors";
import { formatCents, formatDateBR } from "@/lib/utils";

const inputClass = "rounded-xl border border-border bg-white px-3 py-2 text-[14px] text-foreground outline-none focus:border-primary";

function NewStoreForm({ partnerId }: { partnerId: string }) {
  const empty = { name: "", segment: "", floor: "", description: "", instagram: "", website: "" };
  const [form, setForm] = useState(empty);
  const { error, isPending, run } = useAdminAction();
  const set = (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        run(() => addAnchorStore(partnerId, form), () => setForm(empty));
      }}
      className="grid grid-cols-1 gap-2 rounded-2xl border border-dashed border-border p-4 sm:grid-cols-3"
    >
      <input className={inputClass} placeholder="Nome da loja" value={form.name} onChange={set("name")} />
      <input className={inputClass} placeholder="Segmento" value={form.segment} onChange={set("segment")} />
      <input className={inputClass} placeholder="Piso / localização" value={form.floor} onChange={set("floor")} />
      <input className={`${inputClass} sm:col-span-3`} placeholder="Descrição curta" value={form.description} onChange={set("description")} />
      <input className={inputClass} placeholder="Instagram" value={form.instagram} onChange={set("instagram")} />
      <input className={inputClass} placeholder="Site (https://...)" value={form.website} onChange={set("website")} />
      <button type="submit" disabled={isPending} className="neu-primary rounded-full px-5 py-2 text-[14px] font-medium text-white disabled:opacity-60">
        Adicionar loja
      </button>
      {error && <p className="text-[13px] text-red-700 sm:col-span-3">{error}</p>}
    </form>
  );
}

function StoreRow({ partnerId, store }: { partnerId: string; store: AnchorStore }) {
  const { error, isPending, run } = useAdminAction();
  const [paidUntil, setPaidUntil] = useState("");
  const [value, setValue] = useState("");
  const highlighted = isStoreHighlighted(store);

  return (
    <li className="rounded-2xl border border-border bg-white/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[15px] font-semibold text-foreground">
            {store.name}
            {highlighted && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">Destaque pago</span>}
            {!store.active && <span className="ml-2 text-[12px] font-normal text-muted">(oculta)</span>}
          </p>
          <p className="text-[12px] text-muted">{[store.segment, store.floor].filter(Boolean).join(" · ") || "Sem segmento"}</p>
        </div>
        <div className="flex items-center gap-3 text-[13px]">
          <button type="button" disabled={isPending} onClick={() => run(() => setStoreActive(partnerId, store.id, !store.active))} className="text-foreground disabled:opacity-60">
            {store.active ? "Ocultar" : "Mostrar"}
          </button>
          <button type="button" disabled={isPending} onClick={() => run(() => deleteAnchorStore(partnerId, store.id))} className="text-red-600 disabled:opacity-60">
            Excluir
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        {store.highlightPaidUntil ? (
          <>
            <span className="text-[13px] text-muted">
              Destaque até {formatDateBR(store.highlightPaidUntil)}
              {store.highlightValueCents != null && ` · ${formatCents(store.highlightValueCents)} recebidos`}
              {!highlighted && " (vencido)"}
            </span>
            <button type="button" disabled={isPending} onClick={() => run(() => setStoreHighlight(partnerId, store.id, null))} className="text-[13px] text-red-600 disabled:opacity-60">
              Remover
            </button>
          </>
        ) : (
          <span className="text-[13px] text-muted">Sem destaque (só com pagamento):</span>
        )}
        <input type="date" className={inputClass} value={paidUntil} onChange={(e) => setPaidUntil(e.target.value)} />
        <input className={`${inputClass} w-28`} placeholder="Valor R$" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => setStoreHighlight(partnerId, store.id, { paidUntil, valueReais: Number(value.replace(",", ".")) }), () => { setPaidUntil(""); setValue(""); })}
          className="neu rounded-full px-4 py-2 text-[13px] font-medium text-foreground disabled:opacity-60"
        >
          Ativar destaque
        </button>
      </div>
      {error && <p className="mt-2 text-[12px] text-red-700">{error}</p>}
    </li>
  );
}

/** Lojas listadas na página da âncora; destaque só com pagamento registrado. */
export function AnchorStoresPanel({ partnerId, stores }: { partnerId: string; stores: AnchorStore[] }) {
  return (
    <section className="flex flex-col gap-4">
      <p className="text-[17px] font-semibold text-foreground">Lojas ({stores.length})</p>
      <NewStoreForm partnerId={partnerId} />
      <ul className="flex flex-col gap-3">
        {stores.map((store) => (
          <StoreRow key={store.id} partnerId={partnerId} store={store} />
        ))}
      </ul>
    </section>
  );
}
