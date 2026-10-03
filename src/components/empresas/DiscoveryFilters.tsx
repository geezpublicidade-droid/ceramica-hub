import type { Category } from "@/lib/services/categories";
import { DISCOVERY_SORTS, type DiscoveryFilters as Filters } from "@/lib/services/company-discovery";

export type DiscoveryFilterLabels = {
  category: string;
  sub: string;
  spec: string;
  tower: string;
  floor: string;
  all: string;
  verified: string;
  inPerson: string;
  online: string;
  sort: string;
  sortOptions: Record<(typeof DISCOVERY_SORTS)[number], string>;
  apply: string;
  clear: string;
};

type DiscoveryFiltersProps = {
  action: string;
  filters: Filters;
  macros: Category[];
  subs: Category[];
  specs: Category[];
  towers: { id: string; name: string }[];
  floors: string[];
  view: "grid" | "list";
  /** Em /categoria a categoria já vem da URL, então o filtro de categoria some. */
  hideCategory?: boolean;
  labels: DiscoveryFilterLabels;
};

const selectClass =
  "min-h-11 w-full rounded-xl border border-border bg-white px-3 text-[15px] text-foreground outline-none focus:border-primary/40";
const labelClass = "flex flex-col gap-1.5 text-[13px] font-medium uppercase tracking-wide text-muted";

function SelectField({
  name,
  label,
  value,
  allLabel,
  options,
}: {
  name: string;
  label: string;
  value?: string;
  allLabel: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className={labelClass}>
      {label}
      <select name={name} defaultValue={value ?? ""} className={selectClass}>
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckField({ name, label, checked }: { name: string; label: string; checked: boolean }) {
  return (
    <label className="flex min-h-11 items-center gap-3 text-[15px] text-foreground">
      <input type="checkbox" name={name} value="1" defaultChecked={checked} className="h-5 w-5 accent-[var(--primary,#b8553a)]" />
      {label}
    </label>
  );
}

/** Filtros como formulário GET: funciona sem JS e deixa a URL compartilhável. */
export function DiscoveryFilters({
  action,
  filters,
  macros,
  subs,
  specs,
  towers,
  floors,
  view,
  hideCategory,
  labels,
}: DiscoveryFiltersProps) {
  const toOptions = (list: Category[]) => list.map((category) => ({ value: category.slug, label: category.name }));

  return (
    <form action={action} method="get" className="flex flex-col gap-4">
      {filters.q && <input type="hidden" name="q" value={filters.q} />}
      {view === "list" && <input type="hidden" name="view" value="list" />}
      {hideCategory && filters.cat && <input type="hidden" name="cat" value={filters.cat} />}

      {!hideCategory && (
        <SelectField name="cat" label={labels.category} value={filters.cat} allLabel={labels.all} options={toOptions(macros)} />
      )}
      {subs.length > 0 && (
        <SelectField name="sub" label={labels.sub} value={filters.sub} allLabel={labels.all} options={toOptions(subs)} />
      )}
      {specs.length > 0 && (
        <SelectField name="spec" label={labels.spec} value={filters.spec} allLabel={labels.all} options={toOptions(specs)} />
      )}
      <SelectField
        name="tower"
        label={labels.tower}
        value={filters.towerId}
        allLabel={labels.all}
        options={towers.map((tower) => ({ value: tower.id, label: tower.name }))}
      />
      <SelectField
        name="floor"
        label={labels.floor}
        value={filters.floor}
        allLabel={labels.all}
        options={floors.map((floor) => ({ value: floor, label: floor }))}
      />

      <div className="flex flex-col">
        <CheckField name="verified" label={labels.verified} checked={filters.verified} />
        <CheckField name="presencial" label={labels.inPerson} checked={filters.inPerson} />
        <CheckField name="online" label={labels.online} checked={filters.online} />
      </div>

      <label className={labelClass}>
        {labels.sort}
        <select name="sort" defaultValue={filters.sort} className={selectClass}>
          {DISCOVERY_SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {labels.sortOptions[sort]}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-3 pt-1">
        <button type="submit" className="neu-primary min-h-11 flex-1 rounded-full px-6 text-[15px] font-medium text-white">
          {labels.apply}
        </button>
        <a href={action} className="inline-flex min-h-11 items-center px-3 text-[15px] text-muted hover:text-primary">
          {labels.clear}
        </a>
      </div>
    </form>
  );
}
