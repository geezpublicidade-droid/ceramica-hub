"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { RealEstateListing } from "@/lib/services/real-estate";

type Labels = {
  filterAll: string;
  filterVenda: string;
  filterLocacao: string;
  requestInfo: string;
  available: string;
  unavailable: string;
  onRequest: string;
};

const AVAILABILITY_LABEL_KEY: Record<RealEstateListing["availabilityStatus"], keyof Labels> = {
  disponivel: "available",
  indisponivel: "unavailable",
  sob_consulta: "onRequest",
};

export function RealEstateListingsGrid({ listings, labels }: { listings: RealEstateListing[]; labels: Labels }) {
  const searchParams = useSearchParams();
  const tipoParam = searchParams.get("tipo");
  const initialFilter = tipoParam === "venda" || tipoParam === "locacao" ? tipoParam : "todos";
  const [filter, setFilter] = useState<"todos" | "venda" | "locacao">(initialFilter);

  const filtered = useMemo(
    () => (filter === "todos" ? listings : listings.filter((l) => l.listingType === filter)),
    [listings, filter],
  );

  return (
    <div>
      <div className="mt-8 flex flex-wrap gap-2">
        {(["todos", "venda", "locacao"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-4 py-2 text-[14px] font-medium transition-colors ${
              filter === key ? "neu-pressed bg-surface text-primary" : "neu text-muted hover:text-foreground"
            }`}
          >
            {key === "todos" ? labels.filterAll : key === "venda" ? labels.filterVenda : labels.filterLocacao}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {filtered.map((listing) => (
          <div key={listing.id} className="glass-card-light overflow-hidden rounded-3xl">
            {listing.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={listing.photoUrl} alt={listing.title} className="h-40 w-full object-cover" />
            )}
            <div className="p-6">
              <h2 className="text-[19px] font-semibold tracking-tight">{listing.title}</h2>
              <p className="mt-1 text-[14px] text-muted">
                {listing.listingType === "venda" ? labels.filterVenda : labels.filterLocacao} ·{" "}
                {listing.spaceType === "laje_inteira" ? "Laje inteira" : "Sala comercial"}
                {listing.areaM2 && ` · ${listing.areaM2}m²`}
                {listing.towerName && ` · ${listing.towerName}`}
              </p>
              <p className="mt-1 text-[13px] font-medium text-primary">{labels[AVAILABILITY_LABEL_KEY[listing.availabilityStatus]]}</p>
              {listing.priceCents != null && (
                <p className="mt-2 text-[16px] font-semibold text-foreground">
                  {(listing.priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              )}
              {listing.description && <p className="mt-3 text-[16px] leading-relaxed text-muted">{listing.description}</p>}
              <div className="mt-4 flex flex-wrap gap-3">
                {listing.contactWhatsapp && (
                  <a
                    href={`https://wa.me/${listing.contactWhatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neu-primary rounded-full px-5 py-2.5 text-[14px] font-medium text-white"
                  >
                    {labels.requestInfo}
                  </a>
                )}
                {!listing.contactWhatsapp && listing.contactLink && (
                  <a
                    href={listing.contactLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neu-primary rounded-full px-5 py-2.5 text-[14px] font-medium text-white"
                  >
                    {labels.requestInfo}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
