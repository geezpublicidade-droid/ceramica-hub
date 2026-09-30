"use client";

import { useState, useTransition } from "react";
import { createProductAction, updateProductAction, setProductActiveAction } from "@/lib/actions/products";
import {
  PRODUCT_CATEGORY_LABEL,
  BILLING_TYPE_LABEL,
  type Product,
  type ProductInput,
  type ProductCategory,
  type BillingType,
} from "@/lib/services/products";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[14px] font-medium text-foreground";

const CATEGORY_OPTIONS = Object.entries(PRODUCT_CATEGORY_LABEL) as [ProductCategory, string][];
const BILLING_OPTIONS = Object.entries(BILLING_TYPE_LABEL) as [BillingType, string][];

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatPrice(cents: number | null): string {
  return cents === null ? "—" : brl.format(cents / 100);
}

/** O formulário trabalha com texto: preço em reais ("147,00"), benefícios um
 * por linha e limites como linhas "chave=valor". Convertidos ao salvar. */
type FormState = {
  name: string;
  slug: string;
  category: ProductCategory;
  billingType: BillingType;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  benefits: string;
  limits: string;
  sortOrder: string;
  active: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  category: "plano",
  billingType: "mensal",
  description: "",
  monthlyPrice: "",
  yearlyPrice: "",
  benefits: "",
  limits: "",
  sortOrder: "0",
  active: true,
};

function centsToText(cents: number | null): string {
  return cents === null ? "" : (cents / 100).toFixed(2).replace(".", ",");
}

function textToCents(text: string): number | null {
  const normalized = text.trim().replace(/\./g, "").replace(",", ".");
  if (!normalized) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) : Number.NaN;
}

function limitsToText(limits: Product["limits"]): string {
  return Object.entries(limits)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

function textToLimits(text: string): Product["limits"] {
  const limits: Product["limits"] = {};
  for (const line of text.split("\n")) {
    const [key, raw] = line.split("=").map((part) => part.trim());
    if (!key || raw === undefined) continue;
    limits[key] = raw === "true" ? true : raw === "false" ? false : Number(raw);
  }
  return limits;
}

function productToForm(product: Product): FormState {
  return {
    name: product.name,
    slug: product.slug,
    category: product.category,
    billingType: product.billingType,
    description: product.description ?? "",
    monthlyPrice: centsToText(product.monthlyPriceCents),
    yearlyPrice: centsToText(product.yearlyPriceCents),
    benefits: product.benefits.join("\n"),
    limits: limitsToText(product.limits),
    sortOrder: String(product.sortOrder),
    active: product.active,
  };
}

function formToInput(form: FormState, planKey: string | null): ProductInput | string {
  const monthlyPriceCents = textToCents(form.monthlyPrice);
  const yearlyPriceCents = textToCents(form.yearlyPrice);
  if (Number.isNaN(monthlyPriceCents) || Number.isNaN(yearlyPriceCents)) return "Preço inválido.";
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    category: form.category,
    billingType: form.billingType,
    description: form.description.trim() || null,
    monthlyPriceCents,
    yearlyPriceCents,
    benefits: form.benefits
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    limits: textToLimits(form.limits),
    planKey,
    active: form.active,
    sortOrder: Number(form.sortOrder) || 0,
  };
}

function ProductEditor({ editing, onClose }: { editing: Product | null; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(editing ? productToForm(editing) : EMPTY_FORM);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const input = formToInput(form, editing?.planKey ?? null);
    if (typeof input === "string") {
      setError(input);
      return;
    }
    startTransition(async () => {
      const result = editing ? await updateProductAction(editing.id, input) : await createProductAction(input);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-border bg-white/70 p-6">
      <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">
        {editing ? `Editar — ${editing.name}` : "Novo produto"}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label>
          <span className={labelClass}>Nome *</span>
          <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Slug *</span>
          <input className={inputClass} value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="plano-exemplo" />
        </label>
        <label>
          <span className={labelClass}>Categoria</span>
          <select className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value as ProductCategory)}>
            {CATEGORY_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelClass}>Cobrança</span>
          <select className={inputClass} value={form.billingType} onChange={(e) => set("billingType", e.target.value as BillingType)}>
            {BILLING_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelClass}>Valor mensal (R$)</span>
          <input className={inputClass} value={form.monthlyPrice} onChange={(e) => set("monthlyPrice", e.target.value)} placeholder="147,00" />
        </label>
        <label>
          <span className={labelClass}>Valor anual (R$)</span>
          <input className={inputClass} value={form.yearlyPrice} onChange={(e) => set("yearlyPrice", e.target.value)} placeholder="1470,00" />
        </label>
        <label className="sm:col-span-2">
          <span className={labelClass}>Descrição</span>
          <textarea className={inputClass} rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Benefícios (um por linha)</span>
          <textarea className={inputClass} rows={5} value={form.benefits} onChange={(e) => set("benefits", e.target.value)} />
        </label>
        <label>
          <span className={labelClass}>Limites (chave=valor, um por linha)</span>
          <textarea
            className={inputClass}
            rows={5}
            value={form.limits}
            onChange={(e) => set("limits", e.target.value)}
            placeholder={"maxPhotos=6\nvideoAllowed=true"}
          />
        </label>
        <label>
          <span className={labelClass}>Ordem de exibição</span>
          <input type="number" className={inputClass} value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
        </label>
        <label className="flex items-center gap-2 self-end pb-2.5">
          <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
          <span className={labelClass}>Ativo (disponível para propostas)</span>
        </label>
      </div>

      {error && <p className="text-[14px] text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={isPending} className="neu-primary rounded-full px-6 py-3 text-[15px] font-medium text-white disabled:opacity-60">
          {isPending ? "Salvando..." : "Salvar"}
        </button>
        <button type="button" onClick={onClose} className="neu rounded-full px-6 py-3 text-[15px] font-medium text-foreground">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function ProductRow({ product, onEdit }: { product: Product; onEdit: () => void }) {
  const [isPending, startTransition] = useTransition();

  function toggleActive() {
    startTransition(async () => {
      await setProductActiveAction(product.id, !product.active);
    });
  }

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white/70 p-4 ${product.active ? "" : "opacity-60"}`}>
      <div className="min-w-0">
        <p className="text-[16px] font-medium text-foreground">
          {product.name}
          <span className="ml-2 text-[13px] font-normal text-muted">{BILLING_TYPE_LABEL[product.billingType]}</span>
        </p>
        <p className="text-[14px] text-muted">
          {formatPrice(product.monthlyPriceCents)}/mês · {formatPrice(product.yearlyPriceCents)}/ano · {product.benefits.length} benefício(s)
        </p>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onEdit} className="neu rounded-full px-4 py-2 text-[14px] font-medium text-foreground">
          Editar
        </button>
        <button type="button" onClick={toggleActive} disabled={isPending} className="neu rounded-full px-4 py-2 text-[14px] font-medium text-foreground disabled:opacity-60">
          {product.active ? "Desativar" : "Ativar"}
        </button>
      </div>
    </div>
  );
}

export function ProductManager({ products }: { products: Product[] }) {
  // undefined = fechado, null = criando, Product = editando
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);

  return (
    <div className="flex flex-col gap-6">
      {editing === undefined ? (
        <button type="button" onClick={() => setEditing(null)} className="neu-primary self-start rounded-full px-5 py-2.5 text-[14px] font-medium text-white">
          + Novo produto
        </button>
      ) : (
        <ProductEditor key={editing?.id ?? "new"} editing={editing} onClose={() => setEditing(undefined)} />
      )}

      {CATEGORY_OPTIONS.map(([category, label]) => {
        const items = products.filter((product) => product.category === category);
        if (items.length === 0) return null;
        return (
          <section key={category} className="flex flex-col gap-3">
            <h2 className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">{label}</h2>
            {items.map((product) => (
              <ProductRow key={product.id} product={product} onEdit={() => setEditing(product)} />
            ))}
          </section>
        );
      })}
    </div>
  );
}
