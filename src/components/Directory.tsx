"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { categories, type Business } from "@/data/businesses";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { matchBusinesses } from "@/lib/search";
import { useSearch } from "@/components/landing/SearchContext";
import { BusinessAvatar } from "@/components/BusinessAvatar";

type DirectoryProps = {
  businesses: Business[];
};

export function Directory({ businesses }: DirectoryProps) {
  const [active, setActive] = useState<string>("Todas");
  const { query, setQuery } = useSearch();

  const filtered = useMemo(() => {
    const byCategory = active === "Todas" ? businesses : businesses.filter((b) => b.category === active);
    return query && query !== "__oportunidades__" ? matchBusinesses(query, byCategory) : byCategory;
  }, [active, businesses, query]);

  return (
    <section id="empresas" className="relative overflow-hidden bg-surface px-6 py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-0 h-[420px] w-[420px] rounded-full opacity-30 blur-[120px]"
        style={{ background: "radial-gradient(circle, var(--primary-light), transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-tight tracking-tight">
              Quem já faz parte
            </h2>
            <p className="mt-3 max-w-md text-[15px] text-muted">
              Busque por setor e fale direto no WhatsApp com quem trabalha no seu prédio.
            </p>
          </div>
        </div>

        {query && query !== "__oportunidades__" && (
          <div className="mt-6 flex items-center gap-2 text-[13px] text-muted">
            Filtrando por <span className="font-medium text-foreground">“{query}”</span>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-full border border-border px-2.5 py-0.5 text-[12px] hover:bg-white"
            >
              limpar
            </button>
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActive(category)}
              className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                active === category
                  ? "neu-pressed bg-surface text-primary"
                  : "neu text-muted hover:text-foreground"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="mt-14 text-[15px] text-muted">
            Nenhuma empresa encontrada. Tente outro termo ou categoria.
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((business) => (
              <div
                key={business.id}
                className="glass-card-light group flex gap-4 rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)]"
              >
                <Link href={`/empresa/${business.id}`} className="shrink-0">
                  <BusinessAvatar
                    business={business}
                    className="h-16 w-16 rounded-xl bg-white"
                    textClassName="text-[15px] font-semibold text-foreground"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/empresa/${business.id}`} className="min-w-0">
                      <h3 className="text-[16px] font-semibold leading-snug tracking-tight hover:text-primary">
                        {business.name}
                      </h3>
                    </Link>
                    {business.verified && (
                      <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                        Verificado
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[13px] text-muted">
                    {business.category} · {business.floor}
                  </p>
                  <p className="mt-3 text-[14px] leading-relaxed text-muted">{business.description}</p>
                  <a
                    href={buildWhatsAppLink(business.phone, business.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-[13px] font-medium text-primary transition-transform hover:translate-x-1"
                  >
                    Falar no WhatsApp →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
