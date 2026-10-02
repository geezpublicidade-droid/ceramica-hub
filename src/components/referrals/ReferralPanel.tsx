"use client";

import { useState } from "react";
import type { ReferralSummary } from "@/lib/services/referrals";
import { formatDateTimeBR } from "@/lib/utils";

const STATUS_LABEL = { cadastrada: "Cadastrada", convertida: "Virou cliente" } as const;
const REWARD_LABEL = { nenhuma: "—", pendente: "Recompensa em análise", concedida: "Recompensa concedida" } as const;

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sem acesso à área de transferência: o texto continua visível na tela para copiar à mão.
    }
  }
  return (
    <button type="button" onClick={copy} className="neu rounded-full px-4 py-2 text-[13px] font-medium text-foreground">
      {copied ? "Copiado!" : label}
    </button>
  );
}

/** Código, link e histórico de indicações; usado no painel da empresa e na área do membro. */
export function ReferralPanel({ summary }: { summary: ReferralSummary }) {
  const shareText = `Conheça o Cerâmica Hub e cadastre sua empresa pelo meu link: ${summary.link}`;
  return (
    <div className="flex flex-col gap-6">
      <section className="glass-light rounded-3xl p-6">
        <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-muted">Seu código de indicação</p>
        <p className="mt-2 font-mono text-[28px] font-semibold tracking-[0.2em] text-primary">{summary.code}</p>
        <p className="mt-3 break-all text-[14px] text-muted">{summary.link}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <CopyButton text={summary.link} label="Copiar link" />
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="neu-primary rounded-full px-4 py-2 text-[13px] font-medium text-white"
          >
            Compartilhar no WhatsApp
          </a>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-light rounded-2xl p-5">
          <p className="text-[28px] font-semibold text-foreground">{summary.registered}</p>
          <p className="text-[14px] text-muted">Empresas cadastradas</p>
        </div>
        <div className="glass-light rounded-2xl p-5">
          <p className="text-[28px] font-semibold text-foreground">{summary.converted}</p>
          <p className="text-[14px] text-muted">Viraram clientes</p>
        </div>
      </div>

      <section>
        <h2 className="text-[18px] font-semibold text-foreground">Histórico</h2>
        {summary.entries.length === 0 ? (
          <p className="mt-2 text-[15px] text-muted">Nenhuma indicação ainda. Compartilhe seu link para começar.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {summary.entries.map((entry) => (
              <li key={entry.id} className="rounded-2xl border border-border bg-white/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[15px] font-medium text-foreground">{entry.referredName}</p>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[12px] font-medium text-primary">{STATUS_LABEL[entry.status]}</span>
                </div>
                <p className="mt-1 text-[13px] text-muted">
                  {formatDateTimeBR(entry.createdAt)} · {REWARD_LABEL[entry.rewardStatus]}
                  {entry.rewardNote ? `: ${entry.rewardNote}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
