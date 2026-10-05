import type { ReactNode } from "react";
import { LayoutGrid, List } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { FilterDrawer } from "./FilterDrawer";
import { SortSelect } from "./SortSelect";

export type FilterPill = { id: string; label: string; href: string };

export type CategoryFilterBarLabels = {
  subcategories: string;
  all: string;
  more: string;
  filters: string;
  filtersTitle: string;
  close: string;
  sort: string;
  resultsCount: string;
  viewGrid: string;
  viewList: string;
};

type CategoryFilterBarProps = {
  pills: FilterPill[];
  /** href de "Todas" (categoria-mãe); ativo quando nenhuma pílula está ativa */
  allHref: string;
  activePillId: string | null;
  /** pílulas visíveis antes do "Ver mais" em telas largas (no celular a faixa rola e mostra todas) */
  visiblePills: number;
  labels: CategoryFilterBarLabels;
  activeFilterCount: number;
  /** formulário de filtros avançados */
  filtersForm: ReactNode;
  sort: { value: string; options: { value: string; label: string; href: string }[] };
  view: "grid" | "list";
  viewHrefs: { grid: string; list: string };
};

const PILL_BASE = "inline-flex min-h-10 shrink-0 items-center rounded-full border px-4 text-[14px] transition-colors";
const PILL_IDLE = "border-border bg-white text-foreground hover:border-primary/40 hover:text-primary";
const PILL_ACTIVE = "border-primary bg-primary font-medium text-white";

/** Barra compacta: subcategorias em pílulas, botão Filtros (drawer), contagem, ordenação e grade/lista. */
export function CategoryFilterBar({
  pills,
  allHref,
  activePillId,
  visiblePills,
  labels,
  activeFilterCount,
  filtersForm,
  sort,
  view,
  viewHrefs,
}: CategoryFilterBarProps) {
  return (
    <div className="border-b border-border pb-5">
      {pills.length > 0 && (
        <nav
          aria-label={labels.subcategories}
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {/* checkbox "peer": as pílulas além do limite ficam atrás do "Ver mais" nas telas largas */}
          <input type="checkbox" id="more-subcategories" className="peer sr-only" />
          <Link
            href={allHref}
            aria-current={activePillId === null ? "page" : undefined}
            className={`${PILL_BASE} ${activePillId === null ? PILL_ACTIVE : PILL_IDLE}`}
          >
            {labels.all}
          </Link>
          {pills.map((pill, index) => (
            <Link
              key={pill.id}
              href={pill.href}
              aria-current={activePillId === pill.id ? "page" : undefined}
              className={`${PILL_BASE} ${activePillId === pill.id ? PILL_ACTIVE : PILL_IDLE} ${
                index < visiblePills ? "" : "sm:hidden sm:peer-checked:inline-flex"
              }`}
            >
              {pill.label}
            </Link>
          ))}
          {pills.length > visiblePills && (
            <label
              htmlFor="more-subcategories"
              className="hidden min-h-10 shrink-0 cursor-pointer items-center rounded-full border border-dashed border-primary/50 px-4 text-[14px] font-medium text-primary hover:bg-primary/5 sm:inline-flex sm:peer-checked:hidden"
            >
              {labels.more}
            </label>
          )}
        </nav>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-3">
        <FilterDrawer
          title={labels.filtersTitle}
          triggerLabel={labels.filters}
          closeLabel={labels.close}
          activeCount={activeFilterCount}
        >
          {filtersForm}
        </FilterDrawer>
        <p className="text-[14px] text-muted" aria-live="polite">
          {labels.resultsCount}
        </p>
        <div className="ml-auto flex items-center gap-3">
          <SortSelect label={labels.sort} value={sort.value} options={sort.options} />
          <div className="hidden items-center gap-1 rounded-full border border-border bg-white p-1 sm:flex">
            {(["grid", "list"] as const).map((target) => (
              <Link
                key={target}
                href={viewHrefs[target]}
                aria-label={target === "grid" ? labels.viewGrid : labels.viewList}
                aria-current={view === target ? "true" : undefined}
                className={`flex h-9 w-9 items-center justify-center rounded-full ${view === target ? "bg-primary text-white" : "text-muted hover:text-primary"}`}
              >
                {target === "grid" ? (
                  <LayoutGrid aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <List aria-hidden="true" className="h-4 w-4" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
