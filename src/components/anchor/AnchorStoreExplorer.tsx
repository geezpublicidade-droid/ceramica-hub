"use client";

import { useMemo, useState } from "react";
import { instagramUrl } from "@/lib/utils";

export type ExplorerStore = {
  id: string;
  name: string;
  segment: string | null;
  floor: string | null;
  description: string | null;
  instagram: string | null;
  website: string | null;
  highlighted: boolean;
};

type AnchorStoreExplorerProps = {
  stores: ExplorerStore[];
  labels: { all: string; highlight: string; visitSite: string; empty: string };
};

/** Categorias da âncora (Moda, Gastronomia, Serviços...) como filtro da lista completa de lojas. */
export function AnchorStoreExplorer({ stores, labels }: AnchorStoreExplorerProps) {
  const [segment, setSegment] = useState<string | null>(null);
  const segments = useMemo(() => {
    const counts = new Map<string, number>();
    for (const store of stores) {
      if (store.segment) counts.set(store.segment, (counts.get(store.segment) ?? 0) + 1);
    }
    return [...counts.entries()];
  }, [stores]);
  const visible = segment ? stores.filter((store) => store.segment === segment) : stores;

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist">
        {[[null, stores.length] as const, ...segments].map(([name, count]) => {
          const active = segment === name;
          return (
            <button
              key={name ?? "all"}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSegment(name)}
              className={`rounded-full border px-4 py-2 text-[14px] font-medium transition-colors ${
                active ? "border-primary bg-primary text-white" : "border-border bg-white text-foreground hover:border-primary/50"
              }`}
            >
              {name ?? labels.all} <span className={active ? "text-white/80" : "text-muted"}>({count})</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 text-[16px] text-muted">{labels.empty}</p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((store) => (
            <li key={store.id} className="glass-card-light rounded-2xl p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[17px] font-semibold text-foreground">{store.name}</p>
                {store.highlighted && (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-[12px] font-medium text-primary">
                    {labels.highlight}
                  </span>
                )}
              </div>
              <p className="text-[14px] text-muted">{[store.segment, store.floor].filter(Boolean).join(" · ")}</p>
              {store.description && <p className="mt-2 text-[15px] text-foreground/80">{store.description}</p>}
              {(store.instagram || store.website) && (
                <div className="mt-3 flex gap-4 text-[14px] font-medium">
                  {store.instagram && (
                    <a href={instagramUrl(store.instagram)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Instagram
                    </a>
                  )}
                  {store.website && (
                    <a href={store.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {labels.visitSite}
                    </a>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
