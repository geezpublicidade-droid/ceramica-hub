"use client";

import { useMemo, useState } from "react";
import { ContactRow } from "@/components/admin/ContactRow";
import { ContactTableRow } from "@/components/admin/ContactTableRow";
import { SortableTh } from "@/components/admin/SortableTh";
import { useSortableData } from "@/lib/hooks/useSortableData";
import type { Contact } from "@/lib/services/contacts";

const inputClass = "rounded-xl border border-border bg-white px-3 py-2 text-[13px] text-foreground";

type SortKey = "name" | "business" | "category";

const COMPARE: Record<SortKey, (a: Contact, b: Contact) => number> = {
  name: (a, b) => a.name.localeCompare(b.name, "pt-BR"),
  business: (a, b) => (a.businessName ?? "").localeCompare(b.businessName ?? "", "pt-BR"),
  category: (a, b) => (a.businessCategory ?? "").localeCompare(b.businessCategory ?? "", "pt-BR"),
};

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

  const { sorted, sortKey, direction, toggleSort } = useSortableData(filtered, COMPARE);

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
        <p className="text-[13px] text-muted">{sorted.length} de {contacts.length} contatos</p>
      )}

      {sorted.length === 0 && <p className="text-[15px] text-muted">Nenhum contato encontrado com esses filtros.</p>}

      {sorted.length > 0 && (
        <div className="hidden overflow-x-auto rounded-2xl border border-border bg-white/60 md:block">
          <table className="w-full border-collapse text-[13px]">
            <thead className="border-b border-border">
              <tr>
                <SortableTh label="Nome" sortKey="name" activeKey={sortKey} direction={direction} onSort={(k) => toggleSort(k as SortKey)} />
                <SortableTh label="Empresa" sortKey="business" activeKey={sortKey} direction={direction} onSort={(k) => toggleSort(k as SortKey)} />
                <SortableTh label="Categoria" sortKey="category" activeKey={sortKey} direction={direction} onSort={(k) => toggleSort(k as SortKey)} />
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted">Cargo</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted">Contato</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((contact, i) => (
                <ContactTableRow key={contact.id} contact={contact} zebra={i % 2 === 1} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-2 md:hidden">
        {sorted.map((contact) => (
          <ContactRow key={contact.id} contact={contact} showBusiness />
        ))}
      </div>
    </div>
  );
}
