"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProposalAction, updateProposalAction } from "@/lib/actions/proposals";
import { computeTotals, type ProposalInput, type ProposalPeriod } from "@/lib/services/proposals";
import type { Product } from "@/lib/services/products";
import type { AssignableAdmin } from "@/lib/services/admins";
import { formatCents } from "@/lib/utils";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[14px] font-medium text-foreground";

const PERIOD_LABEL: Record<ProposalPeriod, string> = {
  mensal: "Mensal",
  anual: "Anual",
  unico: "Único",
  personalizado: "Personalizado",
};

type ItemState = {
  key: string;
  productId: string | null;
  name: string;
  period: ProposalPeriod;
  price: string; // em reais, texto ("147,00")
  quantity: string;
};

/** Dados iniciais do formulário (vazio ao criar, preenchido ao editar ou ao
 * vir de um lead/empresa). */
export type ProposalFormInitial = {
  leadId: string | null;
  businessId: string | null;
  clientName: string;
  clientEmail: string;
  validUntil: string;
  discountPercent: string;
  discountReais: string;
  terms: string;
  notes: string;
  ownerAdminId: string;
  items: Omit<ItemState, "key">[];
};

type Props = {
  products: Product[];
  admins: AssignableAdmin[];
  initial: ProposalFormInitial;
  proposalId?: string; // presente = editando
};

function parseReais(text: string): number {
  const normalized = text.trim().replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  return normalized && Number.isFinite(value) && value >= 0 ? Math.round(value * 100) : 0;
}

function reaisText(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** Preço de vitrine do produto para o período escolhido. */
function priceFor(product: Product, period: ProposalPeriod): number {
  if (period === "anual") return product.yearlyPriceCents ?? product.monthlyPriceCents ?? 0;
  return product.monthlyPriceCents ?? product.yearlyPriceCents ?? 0;
}

function defaultPeriod(product: Product): ProposalPeriod {
  return product.billingType;
}

let itemCounter = 0;
function nextKey(): string {
  itemCounter += 1;
  return `item-${itemCounter}`;
}

function toInput(state: ProposalFormInitial, items: ItemState[]): ProposalInput {
  return {
    leadId: state.leadId,
    businessId: state.businessId,
    clientName: state.clientName.trim(),
    clientEmail: state.clientEmail.trim() || null,
    validUntil: state.validUntil || null,
    discountPercent: Number(state.discountPercent.replace(",", ".")) || 0,
    discountCents: parseReais(state.discountReais),
    terms: state.terms.trim() || null,
    notes: state.notes.trim() || null,
    ownerAdminId: state.ownerAdminId || null,
    items: items.map((item) => ({
      productId: item.productId,
      name: item.name.trim(),
      period: item.period,
      unitPriceCents: parseReais(item.price),
      quantity: Math.max(1, Math.floor(Number(item.quantity)) || 1),
    })),
  };
}

export function ProposalForm({ products, admins, initial, proposalId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initial);
  const [items, setItems] = useState<ItemState[]>(initial.items.map((item) => ({ ...item, key: nextKey() })));
  const [pickedProduct, setPickedProduct] = useState("");

  const activeProducts = products.filter((product) => product.active);
  const draft = toInput(form, items);
  const totals = computeTotals(draft.items, draft.discountPercent, draft.discountCents);

  function setField<K extends keyof ProposalFormInitial>(key: K, value: ProposalFormInitial[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateItem(key: string, patch: Partial<ItemState>) {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function addProduct() {
    const product = activeProducts.find((candidate) => candidate.id === pickedProduct);
    if (!product) return;
    const period = defaultPeriod(product);
    setItems((prev) => [
      ...prev,
      { key: nextKey(), productId: product.id, name: product.name, period, price: reaisText(priceFor(product, period)), quantity: "1" },
    ]);
    setPickedProduct("");
  }

  function addCustomItem() {
    setItems((prev) => [...prev, { key: nextKey(), productId: null, name: "", period: "unico", price: "0,00", quantity: "1" }]);
  }

  function changePeriod(item: ItemState, period: ProposalPeriod) {
    const product = products.find((candidate) => candidate.id === item.productId);
    updateItem(item.key, { period, ...(product && period !== "personalizado" ? { price: reaisText(priceFor(product, period)) } : {}) });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      if (proposalId) {
        const result = await updateProposalAction(proposalId, draft);
        if (!result.success) return setError(result.error);
        router.refresh();
        return;
      }
      const result = await createProposalAction(draft);
      if (!result.success) return setError(result.error);
      router.push(`/admin/propostas/${result.id}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-2xl border border-border bg-white/70 p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label>
          <span className={labelClass}>Cliente *</span>
          <input className={inputClass} value={form.clientName} onChange={(e) => setField("clientName", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>E-mail do cliente</span>
          <input type="email" className={inputClass} value={form.clientEmail} onChange={(e) => setField("clientEmail", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Válida até</span>
          <input type="date" className={inputClass} value={form.validUntil} onChange={(e) => setField("validUntil", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Responsável comercial</span>
          <select className={inputClass} value={form.ownerAdminId} onChange={(e) => setField("ownerAdminId", e.target.value)}>
            <option value="">Sem responsável</option>
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.email}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="flex flex-col gap-3">
        <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">Itens</p>
        {items.map((item) => (
          <div key={item.key} className="grid grid-cols-2 items-end gap-3 rounded-xl border border-border bg-white p-3 sm:grid-cols-[2fr_1fr_1fr_80px_auto]">
            <label className="col-span-2 sm:col-span-1">
              <span className="text-[12px] text-muted">Item</span>
              <input className={inputClass} value={item.name} onChange={(e) => updateItem(item.key, { name: e.target.value })} />
            </label>
            <label>
              <span className="text-[12px] text-muted">Período</span>
              <select className={inputClass} value={item.period} onChange={(e) => changePeriod(item, e.target.value as ProposalPeriod)}>
                {Object.entries(PERIOD_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-[12px] text-muted">Valor (R$)</span>
              <input className={inputClass} value={item.price} onChange={(e) => updateItem(item.key, { price: e.target.value })} />
            </label>
            <label>
              <span className="text-[12px] text-muted">Qtd</span>
              <input type="number" min={1} className={inputClass} value={item.quantity} onChange={(e) => updateItem(item.key, { quantity: e.target.value })} />
            </label>
            <button
              type="button"
              onClick={() => setItems((prev) => prev.filter((candidate) => candidate.key !== item.key))}
              className="rounded-full px-3 py-2.5 text-[13px] text-red-600"
            >
              Remover
            </button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <select className="rounded-xl border border-border bg-white px-3 py-2 text-[14px]" value={pickedProduct} onChange={(e) => setPickedProduct(e.target.value)}>
            <option value="">Escolher do catálogo…</option>
            {activeProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <button type="button" onClick={addProduct} disabled={!pickedProduct} className="neu rounded-full px-4 py-2 text-[14px] font-medium text-foreground disabled:opacity-50">
            Adicionar
          </button>
          <button type="button" onClick={addCustomItem} className="neu rounded-full px-4 py-2 text-[14px] font-medium text-foreground">
            + Item avulso
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label>
          <span className={labelClass}>Desconto (%)</span>
          <input className={inputClass} value={form.discountPercent} onChange={(e) => setField("discountPercent", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Desconto fixo (R$)</span>
          <input className={inputClass} value={form.discountReais} onChange={(e) => setField("discountReais", e.target.value)} />
        </label>
        <label className="sm:col-span-2">
          <span className={labelClass}>Condições comerciais</span>
          <textarea className={inputClass} rows={3} value={form.terms} onChange={(e) => setField("terms", e.target.value)} />
        </label>
        <label className="sm:col-span-2">
          <span className={labelClass}>Observações internas</span>
          <textarea className={inputClass} rows={2} value={form.notes} onChange={(e) => setField("notes", e.target.value)} />
        </label>
      </div>

      <div className="flex flex-col gap-1 rounded-xl bg-white p-4 text-[15px]">
        <p className="text-muted">Subtotal: {formatCents(totals.subtotalCents)}</p>
        <p className="text-muted">Desconto: − {formatCents(totals.discountTotalCents)}</p>
        <p className="text-[18px] font-semibold text-foreground">Total: {formatCents(totals.totalCents)}</p>
      </div>

      {error && <p className="text-[14px] text-red-600">{error}</p>}

      <button type="submit" disabled={isPending} className="neu-primary self-start rounded-full px-6 py-3 text-[15px] font-medium text-white disabled:opacity-60">
        {isPending ? "Salvando..." : proposalId ? "Salvar alterações" : "Criar proposta"}
      </button>
    </form>
  );
}
