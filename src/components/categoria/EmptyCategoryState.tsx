import type { ReactNode } from "react";

type EmptyCategoryStateProps = {
  title: string;
  description: string;
  actions: ReactNode;
};

/** Categoria sem empresas, ou busca/filtro sem resultado: mensagem curta e um próximo passo. */
export function EmptyCategoryState({ title, description, actions }: EmptyCategoryStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-white/60 px-6 py-14 text-center">
      <h3 className="text-[clamp(1.2rem,2.4vw,1.5rem)] font-semibold tracking-tight">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-[16px] text-muted">{description}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div>
    </div>
  );
}
