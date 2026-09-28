"use client";

import { useMemo, useState } from "react";
import type { BusinessPerformance } from "@/lib/services/results";

const inputClass = "rounded-xl border border-border bg-white px-3 py-2 text-[13px] text-foreground";

export function ResultsBusinessTable({ businesses }: { businesses: BusinessPerformance[] }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [towerFilter, setTowerFilter] = useState("todas");

  const categories = useMemo(() => Array.from(new Set(businesses.map((b) => b.category))).sort(), [businesses]);
  const towers = useMemo(
    () => Array.from(new Set(businesses.map((b) => b.towerName).filter((t): t is string => Boolean(t)))).sort(),
    [businesses]
  );

  const filtered = useMemo(
    () =>
      businesses.filter((b) => {
        if (categoryFilter !== "todas" && b.category !== categoryFilter) return false;
        if (towerFilter !== "todas" && b.towerName !== towerFilter) return false;
        if (search.trim() && !b.businessName.toLowerCase().includes(search.trim().toLowerCase())) return false;
        return true;
      }),
    [businesses, search, categoryFilter, towerFilter]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <input
          className={`${inputClass} min-w-[200px] flex-1`}
          placeholder="Buscar empresa..."
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
        <select className={inputClass} value={towerFilter} onChange={(e) => setTowerFilter(e.target.value)}>
          <option value="todas">Todas as torres</option>
          {towers.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <p className="text-[13px] text-muted">{filtered.length} de {businesses.length} empresas</p>

      <div className="overflow-x-auto rounded-2xl border border-border bg-white/60">
        <table className="w-full min-w-[560px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-4 py-2.5 font-medium">Empresa</th>
              <th className="px-4 py-2.5 font-medium">Categoria</th>
              <th className="px-4 py-2.5 font-medium">Torre</th>
              <th className="px-4 py-2.5 text-right font-medium">Visualizações</th>
              <th className="px-4 py-2.5 text-right font-medium">WhatsApp</th>
              <th className="px-4 py-2.5 text-right font-medium">Rotas</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted">
                  Nenhuma empresa encontrada com esses filtros.
                </td>
              </tr>
            )}
            {filtered.map((b) => (
              <tr key={b.businessId} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-2.5 font-medium text-foreground">{b.businessName}</td>
                <td className="px-4 py-2.5 text-muted">{b.category}</td>
                <td className="px-4 py-2.5 text-muted">{b.towerName ?? "—"}</td>
                <td className="px-4 py-2.5 text-right text-foreground">{b.pageViews}</td>
                <td className="px-4 py-2.5 text-right text-foreground">{b.whatsappClicks}</td>
                <td className="px-4 py-2.5 text-right text-foreground">{b.directionsClicks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
