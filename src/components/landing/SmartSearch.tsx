"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { FadeUp } from "@/components/motion/FadeUp";
import { useSearch } from "./SearchContext";
import { matchBusinesses } from "@/lib/search";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { Business } from "@/data/businesses";

type Suggestion = {
  label: string;
  /** termo real usado no filtro — "parceria" pula direto pra seção de oportunidades */
  term: string;
};

const suggestions: Suggestion[] = [
  { label: "Preciso de uma agência de marketing.", term: "marketing" },
  { label: "Estou procurando um contador.", term: "contabilidade" },
  { label: "Quero encontrar uma clínica.", term: "estética" },
  { label: "Preciso de um advogado.", term: "advocacia" },
  { label: "Procuro um restaurante.", term: "alimentação" },
  { label: "Quero fazer uma parceria.", term: "__oportunidades__" },
];

type SmartSearchProps = {
  businesses: Business[];
};

export function SmartSearch({ businesses }: SmartSearchProps) {
  const reducedMotion = useReducedMotion();
  const { query, setQuery } = useSearch();
  const [inputValue, setInputValue] = useState("");

  const results = useMemo(() => {
    if (!query || query === "__oportunidades__") return [];
    return matchBusinesses(query, businesses).slice(0, 4);
  }, [query, businesses]);

  function applySuggestion(suggestion: Suggestion) {
    setInputValue(suggestion.label);

    if (suggestion.term === "__oportunidades__") {
      setQuery("");
      document.getElementById("oportunidades")?.scrollIntoView({ block: "start" });
      return;
    }

    setQuery(suggestion.term);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setQuery(inputValue);
    document.getElementById("empresas")?.scrollIntoView({ block: "start" });
  }

  return (
    <section className="bg-surface px-6 py-28 text-foreground">
      <div className="mx-auto max-w-3xl text-center">
        <FadeUp className="text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-tight tracking-tight">
          <h2>O que você precisa encontrar hoje?</h2>
        </FadeUp>

        <FadeUp delay={0.1} className="mx-auto mt-10">
          <form
            onSubmit={handleSubmit}
            className="glass-light flex items-center gap-3 rounded-full p-2 pl-6"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 shrink-0 text-muted">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M14 14L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Busque por empresa, serviço, categoria ou especialidade"
              className="min-w-0 flex-1 bg-transparent py-3 text-[15px] text-foreground placeholder:text-muted focus:outline-none"
            />
            <button
              type="submit"
              className="neu-primary shrink-0 rounded-full px-5 py-3 text-[14px] font-medium text-white"
            >
              Buscar
            </button>
          </form>
        </FadeUp>

        <FadeUp delay={0.15} className="mt-6 flex flex-wrap justify-center gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.label}
              type="button"
              onClick={() => applySuggestion(suggestion)}
              className="neu rounded-full px-4 py-2 text-[13px] text-muted transition-colors hover:text-foreground"
            >
              {suggestion.label}
            </button>
          ))}
        </FadeUp>

        {results.length > 0 && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 grid grid-cols-1 gap-3 text-left sm:grid-cols-2"
          >
            {results.map((business) => (
              <div key={business.id} className="glass-card-light rounded-xl p-4">
                <Link href={`/empresa/${business.id}`}>
                  <p className="text-[14px] font-semibold tracking-tight hover:text-primary">
                    {business.name}
                  </p>
                </Link>
                <p className="mt-0.5 text-[12px] text-muted">
                  {business.category} · {business.floor}
                </p>
                <a
                  href={buildWhatsAppLink(business.phone, business.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-primary"
                >
                  Falar no WhatsApp
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            ))}
          </motion.div>
        )}

        {(results.length > 0 || query) && query !== "__oportunidades__" && (
          <a
            href="#empresas"
            onClick={() => setQuery(query || inputValue)}
            className="mt-8 inline-block text-[13px] font-medium text-primary hover:underline"
          >
            Ver todos no diretório →
          </a>
        )}
      </div>
    </section>
  );
}
