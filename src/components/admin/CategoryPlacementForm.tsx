"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCategoryPlacementAction } from "@/lib/actions/admin-category-placements";
import type { PaymentStatus, PlacementFormOptions } from "@/lib/services/category-placements-admin";
import { PAYMENT_STATUS_LABEL } from "@/lib/services/category-placements-admin";
import { parseCentsInput } from "@/lib/utils";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[14px] font-medium text-foreground";

type FormState = {
  businessId: string;
  categoryId: string;
  typeId: string;
  startsAt: string;
  endsAt: string;
  amount: string;
  rotationWeight: string;
  position: string;
  offerText: string;
  contractRef: string;
  proposalId: string;
  campaignId: string;
  paymentStatus: PaymentStatus;
  notes: string;
};

function plusMonthsIso(from: string, months: number): string {
  const date = new Date(`${from}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

function initialState(): FormState {
  const today = new Date().toISOString().slice(0, 10);
  return {
    businessId: "",
    categoryId: "",
    typeId: "",
    startsAt: today,
    endsAt: plusMonthsIso(today, 1),
    amount: "",
    rotationWeight: "1",
    position: "0",
    offerText: "",
    contractRef: "",
    proposalId: "",
    campaignId: "",
    paymentStatus: "pending",
    notes: "",
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

/** Nova posição comercial: empresa + categoria + tipo + período + valor, ligada a proposta/campanha opcionais. */
export function CategoryPlacementForm({ options }: { options: PlacementFormOptions }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialState);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const selectedType = options.types.find((type) => type.id === form.typeId);
  const proposals = options.proposals.filter((p) => !form.businessId || p.businessId === form.businessId);
  const campaigns = options.campaigns.filter((c) => !form.businessId || c.businessId === form.businessId);

  function chooseType(typeId: string) {
    const type = options.types.find((candidate) => candidate.id === typeId);
    setForm((prev) => ({
      ...prev,
      typeId,
      rotationWeight: String(type?.defaultRotationWeight ?? 1),
      // sugere o preço mensal do produto; o admin pode trocar (negociação)
      amount:
        type?.monthlyPriceCents != null && !prev.amount ? (type.monthlyPriceCents / 100).toFixed(2).replace(".", ",") : prev.amount,
    }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const amountCents = parseCentsInput(form.amount);
    if (Number.isNaN(amountCents)) {
      setError("Valor inválido.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await createCategoryPlacementAction({
          businessId: form.businessId,
          categoryId: form.categoryId,
          placementTypeId: form.typeId,
          startsAt: form.startsAt,
          endsAt: form.endsAt,
          amountCents,
          rotationWeight: Number(form.rotationWeight),
          position: Number(form.position),
          offerText: form.offerText.trim() || null,
          contractRef: form.contractRef.trim() || null,
          proposalId: form.proposalId || null,
          marketingCampaignId: form.campaignId || null,
          notes: form.notes.trim() || null,
          paymentStatus: form.paymentStatus,
        });
        if (!result.success) {
          setError(result.error);
          return;
        }
        setForm(initialState());
        setOpen(false);
        router.refresh();
      } catch {
        setError("Não foi possível salvar agora. Tente de novo.");
      }
    });
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="neu-primary self-start rounded-full px-6 py-3 text-[15px] font-medium text-white">
        Nova posição de destaque
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-3xl border border-border bg-white/70 p-6">
      <h2 className="text-lg font-semibold text-foreground">Nova posição de destaque</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Empresa (aprovada)">
          <select required className={inputClass} value={form.businessId} onChange={(e) => set("businessId", e.target.value)}>
            <option value="">Selecione</option>
            {options.businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Categoria ou subcategoria">
          <select required className={inputClass} value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            <option value="">Selecione</option>
            {options.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tipo de posição">
          <select required className={inputClass} value={form.typeId} onChange={(e) => chooseType(e.target.value)}>
            <option value="">Selecione</option>
            {options.types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} ({type.maxSlots} {type.maxSlots === 1 ? "vaga" : "vagas"})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Valor do período (R$)">
          <input className={inputClass} inputMode="decimal" placeholder="Ex.: 490,00" value={form.amount} onChange={(e) => set("amount", e.target.value)} />
          {selectedType && selectedType.monthlyPriceCents == null && (
            <span className="mt-1 block text-[12px] text-muted">Este produto ainda não tem preço em Produtos; informe o valor negociado.</span>
          )}
        </Field>
        <Field label="Início">
          <input required type="date" className={inputClass} value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
        </Field>
        <Field label="Término">
          <input required type="date" className={inputClass} value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
        </Field>
        <Field label="Peso na rotação (1 a 10)">
          <input type="number" min={1} max={10} className={inputClass} value={form.rotationWeight} onChange={(e) => set("rotationWeight", e.target.value)} />
        </Field>
        <Field label="Ordem manual (menor aparece antes)">
          <input type="number" min={0} className={inputClass} value={form.position} onChange={(e) => set("position", e.target.value)} />
        </Field>
        <Field label="Pagamento">
          <select className={inputClass} value={form.paymentStatus} onChange={(e) => set("paymentStatus", e.target.value as PaymentStatus)}>
            {(Object.keys(PAYMENT_STATUS_LABEL) as PaymentStatus[]).map((status) => (
              <option key={status} value={status}>
                {PAYMENT_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Contrato (número ou referência)">
          <input className={inputClass} value={form.contractRef} onChange={(e) => set("contractRef", e.target.value)} />
        </Field>
        <Field label="Proposta">
          <select className={inputClass} value={form.proposalId} onChange={(e) => set("proposalId", e.target.value)}>
            <option value="">Nenhuma</option>
            {proposals.map((proposal) => (
              <option key={proposal.id} value={proposal.id}>
                {proposal.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Campanha de marketing">
          <select className={inputClass} value={form.campaignId} onChange={(e) => set("campaignId", e.target.value)}>
            <option value="">Nenhuma</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Oferta ou benefício exibido no card do Líder (opcional)">
        <input className={inputClass} maxLength={140} value={form.offerText} onChange={(e) => set("offerText", e.target.value)} />
      </Field>
      <Field label="Observações internas">
        <textarea rows={2} className={inputClass} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </Field>
      <p className="text-[13px] text-muted">
        A posição nasce Reservada. Ela entra no ar quando o pagamento está confirmado (ou isento) e o período começou, e sai sozinha no término.
      </p>
      {error && <p className="text-[14px] text-red-700">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={isPending} className="neu-primary rounded-full px-6 py-3 text-[15px] font-medium text-white disabled:opacity-60">
          {isPending ? "Salvando…" : "Reservar posição"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full px-5 py-3 text-[15px] text-muted hover:text-foreground">
          Cancelar
        </button>
      </div>
    </form>
  );
}
