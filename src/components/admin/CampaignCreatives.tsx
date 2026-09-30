"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCampaignCreativeAction, deleteCampaignCreativeAction } from "@/lib/actions/marketing-campaigns";
import type { CampaignCreative } from "@/lib/services/marketing-campaigns";
import { CONTENT_CHANNEL_LABEL, type ContentChannel } from "@/lib/services/content-calendar";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";
const CHANNEL_OPTIONS = Object.entries(CONTENT_CHANNEL_LABEL) as [ContentChannel, string][];

const EMPTY_FORM = { title: "", channel: "" as ContentChannel | "", assetUrl: "", notes: "" };

export function CampaignCreatives({ campaignId, creatives }: { campaignId: string; creatives: CampaignCreative[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  function submit(action: () => Promise<{ success: boolean; error?: string }>, onDone?: () => void) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.success) {
          setError(result.error ?? "Não foi possível concluir.");
          return;
        }
        onDone?.();
        router.refresh();
      } catch {
        setError("Não foi possível concluir agora.");
      }
    });
  }

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    submit(
      () =>
        addCampaignCreativeAction(campaignId, {
          title: form.title,
          channel: form.channel || null,
          assetUrl: form.assetUrl.trim() || null,
          notes: form.notes.trim() || null,
        }),
      () => setForm(EMPTY_FORM),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {creatives.length === 0 ? (
        <p className="text-[14px] text-muted">Nenhuma peça criativa cadastrada.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {creatives.map((creative) => (
            <li key={creative.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white/70 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[15px] font-medium text-foreground">{creative.title}</p>
                <p className="text-[13px] text-muted">
                  {creative.channel ? CONTENT_CHANNEL_LABEL[creative.channel] : "Sem canal"}
                  {creative.notes ? ` · ${creative.notes}` : ""}
                </p>
                {creative.assetUrl && (
                  <a href={creative.assetUrl} target="_blank" rel="noopener noreferrer" className="text-[13px] text-primary underline">
                    Abrir arquivo
                  </a>
                )}
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => submit(() => deleteCampaignCreativeAction(campaignId, creative.id))}
                className="rounded-full border border-danger/30 px-3.5 py-1.5 text-[13px] text-danger disabled:opacity-60"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-white/70 p-4 sm:grid-cols-2">
        <label>
          <span className="text-[14px] font-medium text-foreground">Título da peça *</span>
          <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>
        <label>
          <span className="text-[14px] font-medium text-foreground">Canal</span>
          <select className={inputClass} value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value as ContentChannel | "" })}>
            <option value="">Sem canal</option>
            {CHANNEL_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-[14px] font-medium text-foreground">Link do arquivo (Drive, Canva, Figma)</span>
          <input className={inputClass} placeholder="https://" value={form.assetUrl} onChange={(e) => setForm({ ...form, assetUrl: e.target.value })} />
        </label>
        <label>
          <span className="text-[14px] font-medium text-foreground">Observações</span>
          <input className={inputClass} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" disabled={isPending} className="neu-primary rounded-full px-5 py-2.5 text-[14px] font-medium text-white disabled:opacity-60">
            {isPending ? "Salvando…" : "Adicionar peça"}
          </button>
        </div>
      </form>
      {error && <p className="text-[14px] text-danger">{error}</p>}
    </div>
  );
}
