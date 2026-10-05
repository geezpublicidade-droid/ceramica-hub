import type { ReactNode } from "react";
import { LayoutGrid, List } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { FilterDrawer } from "./FilterDrawer";
import { SortSelect } from "./SortSelect";
import { SubcategoryCarousel3D } from "./SubcategoryCarousel3D";

export type FilterPill = { id: string; label: string; href: string };

export type CategoryFilterBarLabels = {
  subcategories: string;
  all: string;
  subcategoriesPrev: string;
  subcategoriesNext: string;
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
  labels: CategoryFilterBarLabels;
  activeFilterCount: number;
  /** formulário de filtros avançados */
  filtersForm: ReactNode;
  sort: { value: string; options: { value: string; label: string; href: string }[] };
  view: "grid" | "list";
  viewHrefs: { grid: string; list: string };
};


/** Barra compacta: subcategorias num carrossel 3D, botão Filtros (drawer), contagem, ordenação e grade/lista. */
export function CategoryFilterBar({
  pills,
  allHref,
  activePillId,
  labels,
  activeFilterCount,
  filtersForm,
  sort,
  view,
  viewHrefs,
}: CategoryFilterBarProps) {
  return (
    <div data-reveal className="border-b border-border pb-5">
      {pills.length > 0 && (
        <SubcategoryCarousel3D
          ariaLabel={labels.subcategories}
          prevLabel={labels.subcategoriesPrev}
          nextLabel={labels.subcategoriesNext}
          allLabel={labels.all}
          allHref={allHref}
          pills={pills}
          activePillId={activePillId}
        />
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
