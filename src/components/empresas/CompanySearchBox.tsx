"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { SearchResult } from "@/lib/services/global-search";

type CompanySearchBoxProps = {
  defaultValue: string;
  placeholder: string;
  buttonLabel: string;
  /** parâmetros (categoria, torre...) mantidos ao pesquisar de novo, para não perder os filtros */
  hiddenParams: Record<string, string>;
  /** caminho já com o prefixo de idioma (form GET nativo não passa pelo roteador do next-intl) */
  action: string;
};

/** Busca grande com sugestões enquanto digita (reaproveita /api/search); sem JS ainda funciona como form GET. */
export function CompanySearchBox({
  defaultValue,
  placeholder,
  buttonLabel,
  hiddenParams,
  action,
}: CompanySearchBoxProps) {
  const locale = useLocale();
  const router = useRouter();
  const [term, setTerm] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (term.trim().length < 2) return;
    const controller = new AbortController();
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}&locale=${locale}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const all = (await res.json()) as SearchResult[];
        setSuggestions(all.filter((r) => r.type === "empresa" || r.type === "categoria").slice(0, 6));
      } catch {
        // aborto ao digitar de novo ou falha de rede: mantém as sugestões anteriores
      }
    }, 200);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [term, locale]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (formRef.current && !formRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const visible = open && term.trim().length >= 2 && suggestions.length > 0;

  return (
    <form ref={formRef} action={action} method="get" className="relative" role="search">
      {Object.entries(hiddenParams).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <div className="glass-card-light flex items-center gap-2 rounded-full p-2 pl-6">
        <input
          type="search"
          name="q"
          value={term}
          onChange={(event) => {
            setTerm(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          aria-label={placeholder}
          className="min-w-0 flex-1 bg-transparent py-3 text-[17px] text-foreground outline-none placeholder:text-muted"
        />
        <button type="submit" className="neu-primary min-h-12 shrink-0 rounded-full px-7 text-[16px] font-medium text-white">
          {buttonLabel}
        </button>
      </div>

      {visible && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-border bg-white shadow-[0_24px_48px_-24px_rgba(0,0,0,0.3)]">
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.type}-${suggestion.href}-${index}`}>
              <button
                type="button"
                onClick={() => router.push(suggestion.href)}
                className="flex w-full flex-col px-5 py-3 text-left hover:bg-surface"
              >
                <span className="truncate text-[16px] font-medium text-foreground">{suggestion.title}</span>
                <span className="truncate text-[13px] text-muted">{suggestion.subtitle}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
