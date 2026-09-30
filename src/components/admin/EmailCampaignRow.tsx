"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCampaignAction, sendCampaignAction } from "@/lib/actions/email-marketing";
import { EMAIL_KIND_LABEL, type CampaignStats, type EmailCampaign } from "@/lib/services/email-marketing";
import { StatusBadge } from "@/components/admin/StatusBadge";

const STATUS_LABEL = { rascunho: "Rascunho", enviando: "Enviando", enviada: "Enviada" } as const;
const STATUS_STYLE = { rascunho: "bg-black/5 text-muted", enviando: "bg-warning/15 text-warning", enviada: "bg-success/15 text-success" } as const;

const STAT_LABELS: [keyof CampaignStats, string][] = [
  ["enviados", "Enviados"],
  ["entregues", "Entregues"],
  ["aberturas", "Aberturas"],
  ["cliques", "Cliques"],
  ["erros", "Erros"],
  ["descadastros", "Descadastros"],
  ["leads", "Leads gerados"],
];

export function EmailCampaignRow({ campaign }: { campaign: EmailCampaign }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  function run(action: () => Promise<void>) {
    setMessage(null);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch {
        setMessage({ tone: "error", text: "Sem permissão ou falha de conexão. Tente de novo." });
      }
    });
  }

  function handleSend() {
    if (!window.confirm(`Enviar "${campaign.name}" agora para o público "${campaign.audienceName ?? "—"}"? Não dá para desfazer.`)) return;
    run(async () => {
      const result = await sendCampaignAction(campaign.id);
      setMessage(
        result.success
          ? { tone: "ok", text: `Enviado para ${result.result.recipients} destinatário(s): ${result.result.sent} ok, ${result.result.failed} com erro.` }
          : { tone: "error", text: result.error },
      );
    });
  }

  function handleDelete() {
    if (!window.confirm(`Excluir o rascunho "${campaign.name}"?`)) return;
    run(async () => {
      const result = await deleteCampaignAction(campaign.id);
      if (!result.success) setMessage({ tone: "error", text: result.error });
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[15px] font-semibold text-foreground">{campaign.name}</p>
            <StatusBadge label={STATUS_LABEL[campaign.status]} className={STATUS_STYLE[campaign.status]} />
          </div>
          <p className="text-[13px] text-muted">
            {EMAIL_KIND_LABEL[campaign.kind]} · Público: {campaign.audienceName ?? "—"} · Assunto: {campaign.subject}
          </p>
        </div>
        {campaign.status === "rascunho" && (
          <div className="flex gap-2">
            <button type="button" onClick={handleSend} disabled={isPending} className="neu-primary rounded-full px-4 py-2 text-[13px] font-medium text-white disabled:opacity-60">
              {isPending ? "Enviando..." : "Enviar agora"}
            </button>
            <button type="button" onClick={handleDelete} disabled={isPending} className="rounded-full border border-danger/30 px-4 py-2 text-[13px] font-medium text-danger disabled:opacity-60">
              Excluir
            </button>
          </div>
        )}
      </div>

      {campaign.status !== "rascunho" && (
        <dl className="grid grid-cols-3 gap-2 sm:grid-cols-7">
          {STAT_LABELS.map(([key, label]) => (
            <div key={key} className="rounded-xl bg-black/[0.03] px-3 py-2">
              <dt className="text-[11px] uppercase tracking-wide text-muted">{label}</dt>
              <dd className="text-[18px] font-semibold text-foreground">{campaign.stats[key]}</dd>
            </div>
          ))}
        </dl>
      )}

      {message && <p className={`text-[13px] ${message.tone === "ok" ? "text-success" : "text-danger"}`}>{message.text}</p>}
    </div>
  );
}
