"use client";

import { useState } from "react";
import { useAdminAction } from "@/components/admin/useAdminAction";
import {
  createAnchorContract,
  updateContractStatus,
  addDeliverable,
  updateDeliverable,
  deleteDeliverable,
} from "@/lib/actions/admin-anchors";
import {
  CONTRACT_STATUS_LABEL,
  DELIVERABLE_STATUS_LABEL,
  getDeliverableProgress,
  type AnchorStatus,
  type ContractWithDeliverables,
  type DeliverableStatus,
} from "@/lib/services/anchors";
import { formatCents, formatDateBR } from "@/lib/utils";

const inputClass = "rounded-xl border border-border bg-white px-3 py-2 text-[14px] text-foreground outline-none focus:border-primary";

function NewContractForm({ partnerId }: { partnerId: string }) {
  const year = new Date().getFullYear();
  const [form, setForm] = useState({ startsOn: `${year}-01-01`, endsOn: `${year}-12-31`, valueReais: "", notes: "" });
  const { error, isPending, run } = useAdminAction();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    run(() =>
      createAnchorContract(partnerId, {
        startsOn: form.startsOn,
        endsOn: form.endsOn,
        valueReais: form.valueReais ? Number(form.valueReais.replace(",", ".")) : undefined,
        notes: form.notes,
      })
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-2xl border border-dashed border-border p-4">
      <label className="text-[13px] text-muted">
        Início
        <input type="date" className={`${inputClass} mt-1 block`} value={form.startsOn} onChange={(e) => setForm((p) => ({ ...p, startsOn: e.target.value }))} />
      </label>
      <label className="text-[13px] text-muted">
        Fim
        <input type="date" className={`${inputClass} mt-1 block`} value={form.endsOn} onChange={(e) => setForm((p) => ({ ...p, endsOn: e.target.value }))} />
      </label>
      <label className="text-[13px] text-muted">
        Valor (R$)
        <input className={`${inputClass} mt-1 block w-32`} inputMode="decimal" value={form.valueReais} onChange={(e) => setForm((p) => ({ ...p, valueReais: e.target.value }))} />
      </label>
      <label className="min-w-40 flex-1 text-[13px] text-muted">
        Observações
        <input className={`${inputClass} mt-1 block w-full`} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
      </label>
      <button type="submit" disabled={isPending} className="neu-primary rounded-full px-5 py-2 text-[14px] font-medium text-white disabled:opacity-60">
        Novo contrato
      </button>
      {error && <p className="w-full text-[13px] text-red-700">{error}</p>}
    </form>
  );
}

function DeliverableRow({ partnerId, deliverable }: { partnerId: string; deliverable: ContractWithDeliverables["deliverables"][number] }) {
  const { error, isPending, run } = useAdminAction();
  const overdue = deliverable.status === "pendente" && deliverable.dueOn && deliverable.dueOn < new Date().toISOString().slice(0, 10);

  function changeStatus(status: DeliverableStatus) {
    run(() => updateDeliverable(partnerId, deliverable.id, { status, evidenceUrl: deliverable.evidenceUrl ?? "" }));
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/60 px-4 py-2.5">
      <div className="min-w-0">
        <p className={`text-[15px] ${deliverable.status === "cancelada" ? "text-muted line-through" : "text-foreground"}`}>{deliverable.title}</p>
        <p className="text-[12px] text-muted">
          {deliverable.dueOn ? `Prazo ${formatDateBR(deliverable.dueOn)}` : "Sem prazo"}
          {deliverable.deliveredOn && ` · entregue em ${formatDateBR(deliverable.deliveredOn)}`}
          {overdue && <span className="font-medium text-red-700"> · atrasada</span>}
        </p>
        {error && <p className="text-[12px] text-red-700">{error}</p>}
      </div>
      <div className="flex items-center gap-2">
        <select className={inputClass} value={deliverable.status} disabled={isPending} onChange={(e) => changeStatus(e.target.value as DeliverableStatus)}>
          {(Object.keys(DELIVERABLE_STATUS_LABEL) as DeliverableStatus[]).map((status) => (
            <option key={status} value={status}>
              {DELIVERABLE_STATUS_LABEL[status]}
            </option>
          ))}
        </select>
        <button type="button" disabled={isPending} onClick={() => run(() => deleteDeliverable(partnerId, deliverable.id))} className="text-[13px] text-red-600 disabled:opacity-60">
          Excluir
        </button>
      </div>
    </li>
  );
}

function NewDeliverableForm({ partnerId, contractId }: { partnerId: string; contractId: string }) {
  const [title, setTitle] = useState("");
  const [dueOn, setDueOn] = useState("");
  const { error, isPending, run } = useAdminAction();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    run(() => addDeliverable(partnerId, contractId, { title, dueOn }), () => {
      setTitle("");
      setDueOn("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-center gap-2">
      <input className={`${inputClass} min-w-48 flex-1`} placeholder="Nova entrega (ex: post no Instagram do Hub)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input type="date" className={inputClass} value={dueOn} onChange={(e) => setDueOn(e.target.value)} />
      <button type="submit" disabled={isPending} className="neu rounded-full px-4 py-2 text-[13px] font-medium text-foreground disabled:opacity-60">
        Adicionar
      </button>
      {error && <p className="w-full text-[12px] text-red-700">{error}</p>}
    </form>
  );
}

function ContractCard({ partnerId, contract }: { partnerId: string; contract: ContractWithDeliverables }) {
  const { error, isPending, run } = useAdminAction();
  const progress = getDeliverableProgress(contract.deliverables);

  return (
    <div className="rounded-2xl border border-border bg-white/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[16px] font-semibold text-foreground">
            {formatDateBR(contract.startsOn)} a {formatDateBR(contract.endsOn)}
            {contract.valueCents != null && <span className="font-normal text-muted"> · {formatCents(contract.valueCents)}</span>}
          </p>
          <p className="text-[13px] text-muted">
            {progress.done} de {progress.total} entregas realizadas ({progress.percentage}%)
            {progress.overdue > 0 && <span className="font-medium text-red-700"> · {progress.overdue} atrasada(s)</span>}
          </p>
          {contract.notes && <p className="mt-1 text-[13px] text-muted">{contract.notes}</p>}
        </div>
        <select
          className={inputClass}
          value={contract.status}
          disabled={isPending}
          onChange={(e) => run(() => updateContractStatus(partnerId, contract.id, e.target.value as AnchorStatus))}
        >
          {(Object.keys(CONTRACT_STATUS_LABEL) as AnchorStatus[]).map((status) => (
            <option key={status} value={status}>
              {CONTRACT_STATUS_LABEL[status]}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mt-2 text-[13px] text-red-700">{error}</p>}
      <ul className="mt-4 flex flex-col gap-2">
        {contract.deliverables.length === 0 && <li className="text-[14px] text-muted">Nenhuma entrega combinada ainda.</li>}
        {contract.deliverables.map((deliverable) => (
          <DeliverableRow key={deliverable.id} partnerId={partnerId} deliverable={deliverable} />
        ))}
      </ul>
      <NewDeliverableForm partnerId={partnerId} contractId={contract.id} />
    </div>
  );
}

/** Contrato anual da âncora + entregas realizadas/pendentes. */
export function AnchorContractPanel({ partnerId, contracts }: { partnerId: string; contracts: ContractWithDeliverables[] }) {
  return (
    <section className="flex flex-col gap-4">
      <p className="text-[17px] font-semibold text-foreground">Contrato e entregas</p>
      <NewContractForm partnerId={partnerId} />
      {contracts.map((contract) => (
        <ContractCard key={contract.id} partnerId={partnerId} contract={contract} />
      ))}
    </section>
  );
}
