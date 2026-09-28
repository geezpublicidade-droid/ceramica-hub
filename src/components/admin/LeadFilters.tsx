"use client";

import { useMemo, useState } from "react";
import { LeadBoard } from "@/components/admin/LeadBoard";
import type { Lead } from "@/lib/services/leads";
import type { AssignableAdmin } from "@/lib/services/admins";

type Props = {
  leads: Lead[];
  admins: AssignableAdmin[];
  businesses: { id: string; name: string }[];
};

const inputClass = "rounded-xl border border-border bg-white px-3 py-2 text-[13px] text-foreground";

export function LeadFilters({ leads, admins, businesses }: Props) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todas");

  const categories = useMemo(
    () => Array.from(new Set(leads.map((l) => l.category).filter((c): c is string => Boolean(c)))).sort(),
    [leads]
  );

  const filtered = useMemo(
    () =>
      leads.filter((lead) => {
        if (categoryFilter !== "todas" && lead.category !== categoryFilter) return false;
        if (search.trim()) {
          const term = search.trim().toLowerCase();
          const haystack = `${lead.contactName} ${lead.companyName ?? ""}`.toLowerCase();
          if (!haystack.includes(term)) return false;
        }
        return true;
      }),
    [leads, search, categoryFilter]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <input
          className={`${inputClass} min-w-[200px] flex-1`}
          placeholder="Buscar por nome ou empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className={inputClass} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="todas">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {(search.trim() || categoryFilter !== "todas") && (
        <p className="text-[13px] text-muted">{filtered.length} de {leads.length} leads</p>
      )}

      <LeadBoard leads={filtered} admins={admins} businesses={businesses} />
    </div>
  );
}
