"use client";

import { useRouter } from "@/i18n/navigation";

type SortSelectProps = {
  label: string;
  value: string;
  options: { value: string; label: string; href: string }[];
};

/** Ordenação: troca de URL ao escolher (cada opção já vem com o link pronto do servidor). */
export function SortSelect({ label, value, options }: SortSelectProps) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-[14px] text-muted">
      <span className="hidden sm:inline">{label}</span>
      <select
        value={value}
        aria-label={label}
        onChange={(event) => {
          const target = options.find((option) => option.value === event.target.value);
          if (target) router.push(target.href);
        }}
        className="min-h-11 rounded-full border border-border bg-white px-4 text-[14px] text-foreground outline-none focus:border-primary/40"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
