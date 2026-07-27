"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { logSearchPerformed } from "@/lib/actions/log-search";
import type { SearchResult } from "@/lib/services/global-search";

const TYPE_LABEL: Record<SearchResult["type"], string> = {
  empresa: "Empresa",
  categoria: "Categoria",
  hotel: "Hotel",
  espaco: "Auditório/Sala",
  imovel: "Imóvel",
  oportunidade: "Oportunidade",
  promocao: "Promoção",
};

/**
 * Overlay escuro e translúcido, campo grande centralizado, foco automático,
 * fecha com botão/clique fora/Esc, sugestões conforme digita (debounce),
 * loading e "sem resultado" tratados. Consulta tudo que já existe
 * (empresas, categorias, hotéis, auditórios, imóveis, oportunidades,
 * promoções) via /api/search.
 */
export function GlobalSearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("GlobalSearch");
  const locale = useLocale();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setTerm("");
      setResults([]);
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!term.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}&locale=${locale}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
      void logSearchPerformed(term, "global_overlay");
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [term, locale]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 px-6 pt-24 backdrop-blur-sm sm:pt-32"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t("ariaLabel")}
    >
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-3 rounded-full bg-white px-6 py-4 shadow-2xl">
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none" className="shrink-0 text-muted">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M14 14L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={t("placeholder")}
            className="min-w-0 flex-1 bg-transparent text-[18px] text-foreground placeholder:text-muted focus:outline-none"
          />
          <button
            type="button"
            aria-label={t("close")}
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-black/5 hover:text-foreground"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {term.trim() && (
          <div className="mt-3 max-h-[60vh] overflow-y-auto rounded-3xl bg-white p-2 shadow-2xl">
            {loading ? (
              <p className="px-4 py-6 text-center text-[15px] text-muted">{t("loading")}</p>
            ) : results.length === 0 ? (
              <p className="px-4 py-6 text-center text-[15px] text-muted">{t("noResults")}</p>
            ) : (
              results.map((result, index) => (
                <Link
                  key={`${result.type}-${result.title}-${index}`}
                  href={result.href}
                  onClick={onClose}
                  className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-black/5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-foreground">{result.title}</p>
                    <p className="truncate text-[13px] text-muted">{result.subtitle}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {result.sponsored && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{t("sponsored")}</span>
                    )}
                    <span className="text-[12px] text-muted">{TYPE_LABEL[result.type]}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
