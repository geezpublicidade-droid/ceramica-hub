import type { ReactNode } from "react";

type BusinessGridProps = {
  layout: "grid" | "list";
  children: ReactNode;
};

/** 3 colunas no desktop, 2 no tablet, 1 no celular; `items-stretch` iguala a altura dos cards da linha. */
export function BusinessGrid({ layout, children }: BusinessGridProps) {
  return (
    <div
      data-reveal-group
      className={`grid items-stretch gap-5 ${layout === "list" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"}`}
    >
      {children}
    </div>
  );
}
