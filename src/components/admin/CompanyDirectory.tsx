"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CompanyListItem } from "@/lib/services/companies";

const STATUS_LABEL: Record<CompanyListItem["status"], string> = {
  pending: "Pendente",
  approved: "Aprovada",
  rejected: "Rejeitada",
  suspended: "Suspensa",
};

const STATUS_COLOR: Record<CompanyListItem["status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-black/5 text-muted",
  suspended: "bg-red-100 text-red-700",
};

export function CompanyDirectory({ companies }: { companies: CompanyListItem[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CompanyListItem["status"] | "todas">("todas");

  const categories = useMemo(() => Array.from(new Set(companies.map((c) => c.category))).sort(), [companies]);
  const [categoryFilter, setCategoryFilter] = useState<string>("todas");

  const filtered = useMemo(
    () =>
      companies.filter((company) => {
        if (statusFilter !== "todas" && company.status !== statusFilter) return false;
        if (categoryFilter !== "todas" && company.category !== categoryFilter) return false;
        if (search.trim() && !company.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
        return true;
      }),
    [companies, search, statusFilter, categoryFilter]
  );

  const inputClass = "rounded-xl border border-border bg-white px-3 py-2 text-[13px] text-foreground";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <input
          className={`${inputClass} min-w-[200px] flex-1`}
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as CompanyListItem["status"] | "todas")}>
          <option value="todas">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select className={inputClass} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="todas">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <p className="text-[14px] text-muted">{filtered.length} de {companies.length} empresas</p>

      <div className="flex flex-col gap-2">
        {filtered.length === 0 && <p className="text-[15px] text-muted">Nenhuma empresa encontrada com esses filtros.</p>}
        {filtered.map((company) => (
          <Link
            key={company.id}
            href={`/admin/empresas/${company.id}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white/60 px-4 py-3 transition-colors hover:bg-white"
          >
            <div>
              <p className="text-[15px] font-medium text-foreground">{company.name}</p>
              <p className="text-[13px] text-muted">
                {company.category} · {company.towerName ?? "sem torre"} · plano {company.plan}
              </p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${STATUS_COLOR[company.status]}`}>
              {STATUS_LABEL[company.status]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
