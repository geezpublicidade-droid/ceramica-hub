"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { updatePartnerStatus, updatePartnerTier, deleteInstitutionalPartner } from "@/lib/actions/admin-institutional-partners";
import { PARTNER_TIERS, PARTNER_TIER_LABEL, type PartnerTier } from "@/lib/partner-tiers";
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
  const [error, setError] = useState<string | null>(null);

  function changeTier(tier: PartnerTier) {
    setError(null);
    startTransition(async () => {
      const result = await updatePartnerTier(partner.id, tier);
      if (!result.success) setError(result.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-white/70 p-6">
      <div>
        <p className="text-[16px] font-semibold text-foreground">{partner.name}</p>
        <p className="text-[13px] text-muted">{partner.partnershipType}</p>
        {error && <p className="mt-1 text-[12px] text-red-600">{error}</p>}
        {partner.authorizationNote && <p className="mt-1 text-[12px] text-muted">Nota: {partner.authorizationNote}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="rounded-xl border border-border bg-white px-3 py-2 text-[13px] text-foreground disabled:opacity-60"
          value={partner.tier}
          disabled={isPending}
          onChange={(e) => changeTier(e.target.value as PartnerTier)}
        >
          {PARTNER_TIERS.map((tier) => (
            <option key={tier} value={tier}>
              {PARTNER_TIER_LABEL[tier]}
            </option>
          ))}
        </select>
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
        <Link href={`/admin/parceiros/${partner.id}`} className="neu rounded-full px-4 py-2 text-[13px] font-medium text-foreground">
          Gerenciar
        </Link>
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
