"use client";

import { useMemo, useState } from "react";
import { ContactRow } from "@/components/admin/ContactRow";
import type { Contact } from "@/lib/services/contacts";

const inputClass = "rounded-xl border border-border bg-white px-3 py-2 text-[13px] text-foreground";

export function ContactFilters({ contacts }: { contacts: Contact[] }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todas");

  const categories = useMemo(
    () => Array.from(new Set(contacts.map((c) => c.businessCategory).filter((c): c is string => Boolean(c)))).sort(),
    [contacts]
  );

  const filtered = useMemo(
    () =>
      contacts.filter((contact) => {
        if (categoryFilter !== "todas" && contact.businessCategory !== categoryFilter) return false;
        if (search.trim()) {
          const term = search.trim().toLowerCase();
          const haystack = `${contact.name} ${contact.businessName ?? ""}`.toLowerCase();
          if (!haystack.includes(term)) return false;
        }
        return true;
      }),
    [contacts, search, categoryFilter]
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
        <p className="text-[13px] text-muted">{filtered.length} de {contacts.length} contatos</p>
      )}

      <div className="flex flex-col gap-2">
        {filtered.length === 0 && <p className="text-[15px] text-muted">Nenhum contato encontrado com esses filtros.</p>}
        {filtered.map((contact) => (
          <ContactRow key={contact.id} contact={contact} showBusiness />
        ))}
      </div>
    </div>
  );
}
