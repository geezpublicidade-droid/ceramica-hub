import type { Report } from "@/lib/services/reports";

/** Relatório do construtor de relatórios, em cartões; imprimível pelo navegador. */
export function ReportView({ report }: { report: Report }) {
  return (
    <article className="rounded-2xl border border-border bg-white/70 p-5">
      <h2 className="text-[18px] font-semibold capitalize text-foreground">{report.title}</h2>
      <p className="mt-1 text-[14px] text-muted">{report.subtitle}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {report.sections.map((section) => (
          <section key={section.title}>
            <h3 className="text-[15px] font-semibold text-foreground">{section.title}</h3>
            <dl className="mt-2 space-y-1.5">
              {section.lines.map((line) => (
                <div key={line.label} className="flex flex-wrap justify-between gap-x-4 text-[14px]">
                  <dt className="text-muted">{line.label}</dt>
                  <dd className="font-medium text-foreground">{line.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </article>
  );
}
