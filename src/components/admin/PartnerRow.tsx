"use client";

import { useTransition } from "react";
import { updatePartnerStatus, deleteInstitutionalPartner } from "@/lib/actions/admin-institutional-partners";
import type { InstitutionalPartner } from "@/lib/services/institutional-partners";

const STATUS_LABEL: Record<InstitutionalPartner["status"], string> = {
  rascunho: "Rascunho",
  aguardando_autorizacao: "Aguardando autorização",
  aprovado: "Aprovado",
  ativo: "Ativo (visível no site)",
  inativo: "Inativo",
};

const STATUSES = Object.keys(STATUS_LABEL) as InstitutionalPartner["status"][];

export function PartnerRow({ partner }: { partner: InstitutionalPartner }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-white/70 p-6">
      <div>
        <p className="text-[16px] font-semibold text-foreground">{partner.name}</p>
        <p className="text-[13px] text-muted">{partner.partnershipType}</p>
        {partner.authorizationNote && <p className="mt-1 text-[12px] text-muted">Nota: {partner.authorizationNote}</p>}
      </div>
      <div className="flex items-center gap-2">
        <select
          className="rounded-xl border border-border bg-white px-3 py-2 text-[13px] text-foreground disabled:opacity-60"
          value={partner.status}
          disabled={isPending}
          onChange={(e) => startTransition(() => void updatePartnerStatus(partner.id, e.target.value as InstitutionalPartner["status"]))}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => void deleteInstitutionalPartner(partner.id))}
          className="rounded-full border border-red-200 px-4 py-2 text-[13px] font-medium text-red-600 disabled:opacity-60"
        >
          Excluir
        </button>
      </div>
    </div>
  );
}
