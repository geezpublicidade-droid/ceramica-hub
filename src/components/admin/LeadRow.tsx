"use client";

import { useTransition } from "react";
import { updateLeadStatus } from "@/lib/actions/admin-partner-leads";
import type { PartnerLead } from "@/lib/services/partner-leads";

const STATUS_LABEL: Record<PartnerLead["status"], string> = {
  novo: "Novo",
  em_contato: "Em contato",
  convertido: "Convertido",
  descartado: "Descartado",
};

const STATUSES = Object.keys(STATUS_LABEL) as PartnerLead["status"][];

export function LeadRow({ lead }: { lead: PartnerLead }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-white/70 p-6">
      <div>
        <p className="text-[16px] font-semibold text-foreground">{lead.businessName}</p>
        <p className="text-[13px] text-muted">
          {lead.contactName} · {lead.email}
          {lead.phone ? ` · ${lead.phone}` : ""}
        </p>
        {lead.message && <p className="mt-1 max-w-md text-[13px] text-muted">{lead.message}</p>}
        <p className="mt-1 text-[12px] text-muted">
          {new Date(lead.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
        </p>
      </div>
      <select
        className="rounded-xl border border-border bg-white px-3 py-2 text-[13px] text-foreground disabled:opacity-60"
        value={lead.status}
        disabled={isPending}
        onChange={(e) => startTransition(() => void updateLeadStatus(lead.id, e.target.value as PartnerLead["status"]))}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
