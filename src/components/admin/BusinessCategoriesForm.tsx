"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export type CategoryGroup = {
  id: string;
  name: string;
  children: { id: string; name: string; children: { id: string; name: string }[] }[];
};

type SaveResult = { success: boolean; error?: string };

type BusinessCategoriesFormProps = {
  groups: CategoryGroup[];
  /** categoria principal da empresa (vem do cadastro) — só exibida, não editável aqui */
  primaryId: string | null;
  selectedIds: string[];
  /** atendimento presencial/online; omitido = não exibe os campos (uso do admin) */
  serviceModes?: { inPerson: boolean; online: boolean };
  onSave: (input: { categoryIds: string[]; inPerson?: boolean; online?: boolean }) => Promise<SaveResult>;
};

/**
 * Subcategorias e especialidades em que a empresa atua. É isso que a coloca nas páginas
 * de subcategoria (ex.: Dentistas › Ortodontia) e permite contratar destaque nelas.
 */
export function BusinessCategoriesForm({ groups, primaryId, selectedIds, serviceModes, onSave }: BusinessCategoriesFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
  const [inPerson, setInPerson] = useState(serviceModes?.inPerson ?? true);
  const [online, setOnline] = useState(serviceModes?.online ?? false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  function save() {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await onSave({
          categoryIds: [...selected],
          ...(serviceModes ? { inPerson, online } : {}),
        });
        setMessage(result.success ? { ok: true, text: "Categorias salvas." } : { ok: false, text: result.error ?? "Não foi possível salvar." });
        if (result.success) router.refresh();
      } catch {
        setMessage({ ok: false, text: "Não foi possível salvar agora. Tente de novo." });
      }
    });
  }

  const checkClass = "flex min-h-10 items-center gap-3 text-[15px] text-foreground";

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-white/60 p-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Categorias e especialidades</h2>
        <p className="mt-1 text-[14px] text-muted">
          Marque onde a empresa atua. Ela passa a aparecer nessas páginas de categoria e pode contratar destaque nelas.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {groups.map((group) => (
          <fieldset key={group.id} className="flex flex-col">
            <legend className="mb-1 text-[13px] font-semibold uppercase tracking-wide text-primary">
              {group.name}
              {group.id === primaryId && <span className="ml-2 normal-case text-muted">(categoria principal)</span>}
            </legend>
            {group.children.length === 0 && <p className="text-[13px] text-muted">Sem subcategorias cadastradas.</p>}
            {group.children.map((sub) => (
              <div key={sub.id}>
                <label className={checkClass}>
                  <input type="checkbox" className="h-5 w-5" checked={selected.has(sub.id)} onChange={() => toggle(sub.id)} />
                  {sub.name}
                </label>
                {sub.children.map((spec) => (
                  <label key={spec.id} className={`${checkClass} pl-8 text-[14px] text-muted`}>
                    <input type="checkbox" className="h-4 w-4" checked={selected.has(spec.id)} onChange={() => toggle(spec.id)} />
                    {spec.name}
                  </label>
                ))}
              </div>
            ))}
          </fieldset>
        ))}
      </div>

      {serviceModes && (
        <div className="flex flex-wrap gap-6 border-t border-border pt-4">
          <label className={checkClass}>
            <input type="checkbox" className="h-5 w-5" checked={inPerson} onChange={(e) => setInPerson(e.target.checked)} />
            Atendimento presencial
          </label>
          <label className={checkClass}>
            <input type="checkbox" className="h-5 w-5" checked={online} onChange={(e) => setOnline(e.target.checked)} />
            Atendimento online
          </label>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button type="button" onClick={save} disabled={isPending} className="neu-primary rounded-full px-6 py-3 text-[15px] font-medium text-white disabled:opacity-60">
          {isPending ? "Salvando…" : "Salvar categorias"}
        </button>
        {message && <p className={`text-[14px] ${message.ok ? "text-emerald-700" : "text-red-700"}`}>{message.text}</p>}
      </div>
    </section>
  );
}
