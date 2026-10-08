"use client";

import { useState, useTransition } from "react";
import { importGoogleBusiness, searchGoogleBusiness } from "@/lib/actions/google-import";
import { applyGoogleImport } from "@/lib/actions/profile-import";
import { formatSchedule } from "@/lib/landing/hours";
import type { PlaceSummary } from "@/lib/google/places";
import { compareImport, type CurrentProfileValues, type ImportFieldKey } from "@/lib/profile/import-fields";
import type { ProfileDraft } from "@/lib/profile/draft";
import { buttonClass, ghostButtonClass, inputClass } from "./landing/ui";

type Props = { current: CurrentProfileValues; target?: string };
type Loaded = { placeId: string; simulated: boolean; draft: Partial<ProfileDraft> };

const STATUS_LABEL = { new: "Novo", different: "Diferente do seu", same: "Já está igual" } as const;

function show(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") return formatSchedule(value as never).join(" · ");
  return String(value ?? "");
}

/** Busca no Google, mostra campo a campo o que mudaria e aplica só o que a empresa marcar. */
export function GoogleImportPanel({ current, target }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSummary[] | null>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [checked, setChecked] = useState<Set<ImportFieldKey>>(new Set());
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const fail = (text: string) => setMessage({ ok: false, text });

  function search() {
    setMessage(null);
    startTransition(async () => {
      const result = await searchGoogleBusiness(query);
      if (result.success) setResults(result.results);
      else fail(result.error);
    });
  }

  function choose(place: PlaceSummary) {
    setMessage(null);
    startTransition(async () => {
      const result = await importGoogleBusiness(place.id);
      if (!result.success) return fail(result.error);
      setLoaded({ placeId: place.id, simulated: result.simulated, draft: result.draft });
      // marcados de início: o que é novo (campo vazio); o que já existe e difere só se a pessoa quiser trocar
      setChecked(new Set(compareImport(current, result.draft).filter((row) => row.status === "new").map((row) => row.key)));
    });
  }

  function apply() {
    if (!loaded) return;
    startTransition(async () => {
      const result = await applyGoogleImport(target, loaded.placeId, [...checked]);
      setMessage(result.success ? { ok: true, text: `${result.applied.length} campo(s) atualizado(s) no seu perfil.` } : { ok: false, text: result.error });
    });
  }

  const rows = loaded ? compareImport(current, loaded.draft) : [];
  const toggle = (key: ImportFieldKey) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-3">
        <input className={`${inputClass} mt-0`} placeholder="Nome da empresa (e cidade)" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} />
        <button type="button" disabled={pending} onClick={search} className={buttonClass}>
          {pending && !loaded ? "Buscando…" : "Buscar"}
        </button>
      </div>

      {results && !loaded && (
        <ul className="flex flex-col gap-2">
          {results.length === 0 && <li className="text-[15px] text-muted">Nada encontrado. Tente o nome completo com a cidade.</li>}
          {results.map((place) => (
            <li key={place.id}>
              <button type="button" disabled={pending} onClick={() => choose(place)} className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-left transition hover:border-primary">
                <span className="block text-[16px] font-medium text-foreground">{place.name}</span>
                <span className="block text-[14px] text-muted">{place.address}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {loaded && (
        <div className="flex flex-col gap-3">
          {loaded.simulated && <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-[14px] text-amber-900">Modo de demonstração: a conexão com o Google ainda não foi ativada, estes são dados de exemplo.</p>}
          {rows.length === 0 && <p className="text-[15px] text-muted">O Google não trouxe nenhum dado que possamos importar.</p>}
          {rows.map((row) => (
            <label key={row.key} className={`flex items-start gap-3 rounded-2xl border bg-white p-4 ${row.status === "same" ? "opacity-60" : "border-border"}`}>
              <input type="checkbox" className="mt-1" disabled={row.status === "same"} checked={checked.has(row.key)} onChange={() => toggle(row.key)} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-semibold text-foreground">{row.label}</span>
                  <span className="text-[12px] font-medium text-muted">{STATUS_LABEL[row.status]}</span>
                </span>
                <span className="mt-1 block break-words text-[14px] text-foreground">{show(row.incoming)}</span>
                {row.status === "different" && <span className="mt-1 block break-words text-[13px] text-muted">Hoje: {show(row.current)}</span>}
              </span>
            </label>
          ))}
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={pending || checked.size === 0} onClick={apply} className={buttonClass}>
              {pending ? "Aplicando…" : `Aplicar ${checked.size} campo(s)`}
            </button>
            <button type="button" onClick={() => (setLoaded(null), setMessage(null))} className={ghostButtonClass}>
              Escolher outra empresa
            </button>
          </div>
        </div>
      )}

      {message && <p className={`text-[15px] ${message.ok ? "text-primary" : "text-red-600"}`}>{message.text}</p>}
    </div>
  );
}
