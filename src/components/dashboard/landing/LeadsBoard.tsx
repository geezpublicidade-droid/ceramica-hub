"use client";

import { useState } from "react";
import { updateLeadStatus } from "@/lib/actions/landing-editor";
import { whatsappUrl } from "@/lib/landing/whatsapp";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/landing/leads";
import type { BusinessLead } from "@/lib/services/landing-editor-data";
import { Field, buttonClass, inputClass, useSaver } from "./ui";

function LeadCard({ lead, target }: { lead: BusinessLead; target?: string }) {
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const { pending, message, run } = useSaver();
  const when = new Date(lead.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  return (
    <li className="rounded-lg border border-border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[16px] font-semibold">{lead.name}</p>
          <p className="mt-0.5 text-[13.5px] text-muted">
            {when} · origem: {lead.source ?? "direto"}
            {lead.device ? ` · ${lead.device === "mobile" ? "celular" : "computador"}` : ""}
          </p>
        </div>
        <a href={whatsappUrl(lead.phone, `Olá ${lead.name.split(" ")[0]}! Recebemos seu pedido pelo Cerâmica Hub.`)} target="_blank" rel="noopener noreferrer" className="rounded-md bg-whatsapp px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-whatsapp-hover">
          Responder no WhatsApp
        </a>
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-1 text-[14px] sm:grid-cols-2">
        <div>
          <dt className="inline text-muted">Telefone: </dt>
          <dd className="inline">{lead.phone}</dd>
        </div>
        {lead.email && (
          <div>
            <dt className="inline text-muted">E-mail: </dt>
            <dd className="inline">{lead.email}</dd>
          </div>
        )}
        {lead.serviceName && (
          <div>
            <dt className="inline text-muted">Serviço: </dt>
            <dd className="inline">{lead.serviceName}</dd>
          </div>
        )}
      </dl>
      {lead.message && <p className="mt-2 rounded-md bg-black/[0.03] p-3 text-[14px] leading-relaxed">{lead.message}</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-[14rem_1fr_auto] sm:items-end">
        <Field label="Andamento">
          <select value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)} className={inputClass}>
            {LEAD_STATUSES.map((value) => (
              <option key={value} value={value}>
                {LEAD_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Observações internas">
          <input maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
        </Field>
        <button type="button" disabled={pending} onClick={() => run(() => updateLeadStatus(target, { leadId: lead.id, status, notes }))} className={buttonClass}>
          Salvar
        </button>
      </div>
      {message && <p className={`mt-2 text-[13.5px] font-medium ${message.ok ? "text-whatsapp" : "text-red-700"}`}>{message.text}</p>}
    </li>
  );
}

/** Lista de leads do formulário da landing, com andamento e observações. */
export function LeadsBoard({ leads, target }: { leads: BusinessLead[]; target?: string }) {
  const [filter, setFilter] = useState<LeadStatus | "todos">("todos");
  const visible = filter === "todos" ? leads : leads.filter((lead) => lead.status === filter);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {(["todos", ...LEAD_STATUSES] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`tap rounded-full px-3.5 py-1.5 text-[13px] font-medium ${filter === value ? "bg-primary text-white" : "border border-border bg-white hover:bg-black/5"}`}
          >
            {value === "todos" ? `Todos (${leads.length})` : `${LEAD_STATUS_LABELS[value]} (${leads.filter((lead) => lead.status === value).length})`}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <p className="mt-6 text-[14.5px] text-muted">{leads.length === 0 ? "Nenhum pedido recebido ainda. Ative o formulário em Landing page → Botões e conversão." : "Nenhum lead neste andamento."}</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {visible.map((lead) => (
            <LeadCard key={`${lead.id}-${lead.status}-${lead.notes}`} lead={lead} target={target} />
          ))}
        </ul>
      )}
    </div>
  );
}
