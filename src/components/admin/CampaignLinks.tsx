"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { linkToCampaignAction } from "@/lib/actions/marketing-campaigns";
import { LINK_KIND_LABEL, type CampaignLinks as Links, type LinkKind } from "@/lib/services/marketing-campaign-links";

const KINDS = Object.keys(LINK_KIND_LABEL) as LinkKind[];

function KindSection({
  kind,
  linked,
  available,
  onLink,
  disabled,
}: {
  kind: LinkKind;
  linked: Links[LinkKind];
  available: Links[LinkKind];
  onLink: (entityId: string | null, unlinkId?: string) => void;
  disabled: boolean;
}) {
  const [selected, setSelected] = useState("");
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-white/70 p-4">
      <p className="text-[14px] font-medium text-foreground">
        {LINK_KIND_LABEL[kind]} ({linked.length})
      </p>
      {linked.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-2 text-[14px]">
          <span className="min-w-0 truncate text-foreground">
            {item.label} <span className="text-muted">· {item.status}</span>
          </span>
          <button type="button" disabled={disabled} onClick={() => onLink(null, item.id)} className="shrink-0 text-[13px] text-danger underline disabled:opacity-60">
            Desvincular
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-border bg-white px-3 py-2 text-[14px] text-foreground"
        >
          <option value="">Vincular item sem campanha…</option>
          {available.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={disabled || !selected}
          onClick={() => {
            onLink(selected);
            setSelected("");
          }}
          className="neu rounded-full px-4 py-2 text-[13px] font-medium text-foreground disabled:opacity-60"
        >
          Vincular
        </button>
      </div>
    </div>
  );
}

export function CampaignLinks({ campaignId, linked, available }: { campaignId: string; linked: Links; available: Links }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function link(kind: LinkKind, entityId: string | null, unlinkId?: string) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await linkToCampaignAction(kind, unlinkId ?? (entityId as string), entityId ? campaignId : null);
        if (!result.success) setError(result.error);
        else router.refresh();
      } catch {
        setError("Não foi possível vincular agora.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {KINDS.map((kind) => (
          <KindSection
            key={kind}
            kind={kind}
            linked={linked[kind]}
            available={available[kind]}
            disabled={isPending}
            onLink={(entityId, unlinkId) => link(kind, entityId, unlinkId)}
          />
        ))}
      </div>
      {error && <p className="text-[14px] text-danger">{error}</p>}
    </div>
  );
}
