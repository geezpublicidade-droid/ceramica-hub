"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  convertLeadToAdvertiserAction,
  convertLeadToContactAction,
  updateLeadOwnerAction,
  updateLeadStageAction,
} from "@/lib/actions/leads";
import { LEAD_SOURCE_LABEL, LEAD_STAGE_LABEL, LEAD_STAGE_ORDER, type Lead } from "@/lib/services/leads";
import { TEMPERATURE_CLASS, TEMPERATURE_LABEL } from "@/lib/lead-temperature";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatCents, formatDateBR } from "@/lib/utils";
import type { AssignableAdmin } from "@/lib/services/admins";

const selectClass = "rounded-lg border border-border bg-white px-2 py-1 text-[12px] text-foreground outline-none";

type Props = { lead: Lead; admins: AssignableAdmin[]; businesses: { id: string; name: string }[] };

export function LeadCard({ lead, admins, businesses }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showLossReason, setShowLossReason] = useState(false);
  const [lossReason, setLossReason] = useState("");
  const [showConvert, setShowConvert] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");

  function handleStageChange(stage: string) {
    if (stage === "perdido") {
      setShowLossReason(true);
      return;
    }
    startTransition(() => void updateLeadStageAction(lead.id, stage as Lead["stage"]));
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-white/80 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[15px] font-semibold leading-snug text-foreground">{lead.contactName}</p>
          {lead.companyName && <p className="text-[13px] text-muted">{lead.companyName}</p>}
        </div>
        <StatusBadge label={TEMPERATURE_LABEL[lead.temperature]} className={TEMPERATURE_CLASS[lead.temperature]} />
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted">
        <span>{LEAD_SOURCE_LABEL[lead.source]}</span>
        {lead.category && <span>{lead.category}</span>}
        {lead.towerName && <span>{lead.towerName}</span>}
        {lead.estimatedValueCents != null && (
          <span className="font-medium text-foreground">{formatCents(lead.estimatedValueCents)}</span>
        )}
      </div>

      {(lead.phone || lead.whatsapp || lead.email) && (
        <p className="text-[12px] text-muted">{[lead.phone, lead.whatsapp, lead.email].filter(Boolean).join(" · ")}</p>
      )}

      {lead.nextAction && (
        <p className="text-[12px] text-foreground">
          Próxima ação: {lead.nextAction}
          {lead.nextActionAt && ` — ${formatDateBR(lead.nextActionAt)}`}
        </p>
      )}

      {lead.lossReason && <p className="text-[12px] text-red-600">Motivo da perda: {lead.lossReason}</p>}

      <div className="flex flex-wrap gap-2 border-t border-border pt-2.5">
        <select
          className={selectClass}
          value={lead.stage}
          disabled={isPending}
          onChange={(e) => handleStageChange(e.target.value)}
        >
          {LEAD_STAGE_ORDER.map((stage) => (
            <option key={stage} value={stage}>
              {LEAD_STAGE_LABEL[stage]}
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          value={lead.ownerAdminId ?? ""}
          disabled={isPending}
          onChange={(e) => startTransition(() => void updateLeadOwnerAction(lead.id, e.target.value || null))}
        >
          <option value="">Sem responsável</option>
          {admins.map((admin) => (
            <option key={admin.id} value={admin.id}>
              {admin.email}
            </option>
          ))}
        </select>
      </div>

      {showLossReason && (
        <div className="flex flex-wrap gap-2">
          <input
            className="flex-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-[12px]"
            placeholder="Motivo da perda (opcional)"
            value={lossReason}
            onChange={(e) => setLossReason(e.target.value)}
          />
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              startTransition(() => void updateLeadStageAction(lead.id, "perdido", lossReason));
              setShowLossReason(false);
            }}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-60"
          >
            Confirmar
          </button>
        </div>
      )}

      {lead.stage !== "perdido" && (
        <Link href={`/admin/propostas/nova?leadId=${lead.id}`} className="text-[12px] font-medium text-primary hover:underline">
          Criar proposta →
        </Link>
      )}

      {lead.stage !== "fechado" && lead.stage !== "perdido" && !lead.convertedBusinessId && (
        <div className="border-t border-border pt-2.5">
          {!showConvert ? (
            <button
              type="button"
              onClick={() => setShowConvert(true)}
              className="text-[12px] font-medium text-primary hover:underline"
            >
              Converter →
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <select
                  className={`${selectClass} flex-1`}
                  value={selectedBusinessId}
                  onChange={(e) => setSelectedBusinessId(e.target.value)}
                >
                  <option value="">Vincular a empresa existente…</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={isPending || !selectedBusinessId}
                  onClick={() => startTransition(() => void convertLeadToContactAction(lead.id, selectedBusinessId))}
                  className="neu rounded-lg px-3 py-1.5 text-[12px] font-medium text-foreground disabled:opacity-60"
                >
                  Virar contato
                </button>
              </div>
              <button
                type="button"
                disabled={isPending || !lead.email}
                onClick={() => startTransition(() => void convertLeadToAdvertiserAction(lead.id))}
                className="neu-primary self-start rounded-lg px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-60"
                title={!lead.email ? "Lead precisa de e-mail" : undefined}
              >
                Virar conta de anunciante
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
