"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAudienceAction, previewAudienceAction } from "@/lib/actions/email-marketing";
import type { AudienceFilters, AudiencePreview, AudienceStatus } from "@/lib/services/marketing-audiences";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] text-foreground outline-none focus:border-primary";
const labelClass = "text-[14px] font-medium text-foreground";

const PLAN_OPTIONS = [
  { value: "presenca", label: "Presença" },
  { value: "profissional", label: "Profissional" },
  { value: "destaque", label: "Destaque" },
  { value: "experiencia", label: "Experiência" },
  { value: "premium", label: "Premium" },
];

type FilterOptions = { categories: string[]; tags: string[]; towers: { id: string; name: string }[] };

function CheckList({
  title,
  options,
  selected,
  onChange,
}: {
  title: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  if (options.length === 0) return null;
  return (
    <fieldset>
      <legend className={labelClass}>{title}</legend>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = selected.includes(option.value);
          return (
            <label
              key={option.value}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-[13px] ${
                checked ? "border-primary bg-primary-soft text-primary" : "border-border bg-white text-muted"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() => onChange(checked ? selected.filter((v) => v !== option.value) : [...selected, option.value])}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Montagem de público: os filtros mudam, "Ver alcance" calcula quantas
 * empresas casam e quantas podem de fato receber (com consentimento). */
export function AudienceBuilder({ options }: { options: FilterOptions }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [filters, setFilters] = useState<AudienceFilters>({ status: "ativo" });
  const [preview, setPreview] = useState<AudiencePreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setFilter<K extends keyof AudienceFilters>(key: K, value: AudienceFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPreview(null);
  }

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch {
        setError("Sem permissão ou falha de conexão. Tente de novo.");
      }
    });
  }

  function handlePreview() {
    run(async () => {
      const result = await previewAudienceAction(filters);
      if (result.success) setPreview(result.preview);
      else setError(result.error);
    });
  }

  function handleSave() {
    run(async () => {
      const result = await createAudienceAction({ name, description: description || null, filters });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setName("");
      setDescription("");
      setFilters({ status: "ativo" });
      setPreview(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white/70 p-6">
      <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">Novo público</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label>
          <span className={labelClass}>Nome *</span>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Empresas do Corporate" />
        </label>
        <label>
          <span className={labelClass}>Situação</span>
          <select className={inputClass} value={filters.status} onChange={(e) => setFilter("status", e.target.value as AudienceStatus)}>
            <option value="ativo">Clientes ativos</option>
            <option value="inativo">Clientes inativos (suspensos)</option>
            <option value="todos">Todos</option>
          </select>
        </label>
      </div>

      <CheckList
        title="Categoria empresarial"
        options={options.categories.map((c) => ({ value: c, label: c }))}
        selected={filters.categories ?? []}
        onChange={(next) => setFilter("categories", next)}
      />
      <CheckList title="Plano contratado" options={PLAN_OPTIONS} selected={filters.plans ?? []} onChange={(next) => setFilter("plans", next)} />
      <CheckList
        title="Localização (torre)"
        options={options.towers.map((t) => ({ value: t.id, label: t.name }))}
        selected={filters.towerIds ?? []}
        onChange={(next) => setFilter("towerIds", next)}
      />
      <CheckList
        title="Tags"
        options={options.tags.map((t) => ({ value: t, label: t }))}
        selected={filters.tags ?? []}
        onChange={(next) => setFilter("tags", next)}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label>
          <span className={labelClass}>Cadastro a partir de</span>
          <input type="date" className={inputClass} value={filters.signupFrom ?? ""} onChange={(e) => setFilter("signupFrom", e.target.value || undefined)} />
        </label>
        <label>
          <span className={labelClass}>Cadastro até</span>
          <input type="date" className={inputClass} value={filters.signupTo ?? ""} onChange={(e) => setFilter("signupTo", e.target.value || undefined)} />
        </label>
        <label className="flex items-end gap-2 pb-3 text-[14px] text-foreground">
          <input type="checkbox" checked={Boolean(filters.founderOnly)} onChange={(e) => setFilter("founderOnly", e.target.checked)} />
          Só empresas fundadoras
        </label>
      </div>

      <label>
        <span className={labelClass}>Descrição</span>
        <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>

      {preview && (
        <div className="rounded-xl border border-border bg-white px-4 py-3 text-[14px] text-foreground">
          <p>
            <strong>{preview.matching}</strong> empresas no público · <strong>{preview.withConsent}</strong> podem receber e-mail (com
            consentimento).
          </p>
          {preview.matching > preview.withConsent && (
            <p className="mt-1 text-muted">
              {preview.matching - preview.withConsent} ficam de fora por não terem consentimento de marketing ou por terem cancelado a inscrição.
            </p>
          )}
        </div>
      )}

      {error && <p className="text-[14px] text-danger">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={handlePreview} disabled={isPending} className="neu rounded-full px-6 py-3 text-[15px] font-medium text-foreground disabled:opacity-60">
          Ver alcance
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !name.trim()}
          className="neu-primary rounded-full px-6 py-3 text-[15px] font-medium text-white disabled:opacity-60"
        >
          Salvar público
        </button>
      </div>
    </div>
  );
}
