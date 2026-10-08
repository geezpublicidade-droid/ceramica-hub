"use client";

import { useState, useTransition } from "react";
import { importGoogleBusiness, searchGoogleBusiness } from "@/lib/actions/google-import";
import type { PlaceSummary } from "@/lib/google/places";
import type { ProfileDraft } from "@/lib/profile/draft";
import { inputClass, smallButtonClass, StepHeader } from "./wizard-ui";

type Props = {
  /** Chamado com o que o Google trouxe; o wizard decide como juntar ao que já foi digitado. */
  onImported: (draft: Partial<ProfileDraft>, simulated: boolean) => void;
  imported: boolean;
};

/** Primeira etapa (opcional): busca a empresa no Google e preenche o resto do wizard. */
export function GoogleImportStep({ onImported, imported }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSummary[] | null>(null);
  const [simulated, setSimulated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function search() {
    setError(null);
    startTransition(async () => {
      const result = await searchGoogleBusiness(query);
      if (!result.success) return setError(result.error);
      setResults(result.results);
      setSimulated(result.simulated);
    });
  }

  function choose(place: PlaceSummary) {
    setError(null);
    startTransition(async () => {
      const result = await importGoogleBusiness(place.id);
      if (!result.success) return setError(result.error);
      onImported(result.draft, result.simulated);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <StepHeader
        eyebrow="Etapa 1 · Importar"
        title="Já tem perfil no Google?"
        hint="Busque sua empresa e trazemos nome, telefone, horários, site e mais. Você confere tudo nas próximas etapas. Se preferir, pule e preencha à mão."
      />
      <div className="flex gap-3">
        <input
          className={`${inputClass} mt-0`}
          placeholder="Nome da empresa (e cidade)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search())}
        />
        <button type="button" disabled={pending} onClick={search} className={smallButtonClass}>
          {pending ? "Buscando…" : "Buscar"}
        </button>
      </div>
      {simulated && results && (
        <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-[14px] text-amber-900">Modo de demonstração: a conexão com o Google ainda não foi ativada, estes são dados de exemplo.</p>
      )}
      {results?.length === 0 && <p className="text-[15px] text-muted">Nada encontrado. Tente o nome completo com a cidade, ou pule esta etapa.</p>}
      <ul className="flex flex-col gap-2">
        {results?.map((place) => (
          <li key={place.id}>
            <button type="button" disabled={pending} onClick={() => choose(place)} className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-left transition hover:border-primary">
              <span className="block text-[16px] font-medium text-foreground">{place.name}</span>
              <span className="block text-[14px] text-muted">{place.address}</span>
            </button>
          </li>
        ))}
      </ul>
      {imported && <p className="text-[15px] font-medium text-primary">Dados importados. Continue para conferir e completar.</p>}
      {error && <p className="text-[15px] text-red-600">{error}</p>}
    </div>
  );
}
