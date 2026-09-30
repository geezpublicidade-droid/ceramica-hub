"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveManualResultsAction } from "@/lib/actions/marketing-campaigns";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";

type Initial = { views: number; clicks: number; notes: string | null };

/** Números de canais sem rastreio automático (Instagram, mídia externa...). */
export function CampaignManualResults({ campaignId, initial }: { campaignId: string; initial: Initial }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [views, setViews] = useState(String(initial.views));
  const [clicks, setClicks] = useState(String(initial.clicks));
  const [notes, setNotes] = useState(initial.notes ?? "");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await saveManualResultsAction(campaignId, {
          views: Number(views),
          clicks: Number(clicks),
          notes: notes.trim() || null,
        });
        setMessage(result.success ? { ok: true, text: "Salvo." } : { ok: false, text: result.error });
        if (result.success) router.refresh();
      } catch {
        setMessage({ ok: false, text: "Não foi possível salvar agora." });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-white/70 p-4 sm:grid-cols-2">
      <label>
        <span className="text-[14px] font-medium text-foreground">Visualizações fora do Hub</span>
        <input className={inputClass} inputMode="numeric" value={views} onChange={(e) => setViews(e.target.value)} />
      </label>
      <label>
        <span className="text-[14px] font-medium text-foreground">Cliques fora do Hub</span>
        <input className={inputClass} inputMode="numeric" value={clicks} onChange={(e) => setClicks(e.target.value)} />
      </label>
      <label className="sm:col-span-2">
        <span className="text-[14px] font-medium text-foreground">Observações do resultado</span>
        <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={isPending} className="neu-primary rounded-full px-5 py-2.5 text-[14px] font-medium text-white disabled:opacity-60">
          {isPending ? "Salvando…" : "Salvar resultados"}
        </button>
        {message && <span className={`text-[14px] ${message.ok ? "text-muted" : "text-danger"}`}>{message.text}</span>}
      </div>
    </form>
  );
}
