import Link from "next/link";
import { requireAdminPage } from "@/lib/auth-guards";
import { AdminShell } from "@/components/admin/AdminShell";
import { CategoryPlacementForm } from "@/components/admin/CategoryPlacementForm";
import { CategoryPlacementRow } from "@/components/admin/CategoryPlacementRow";
import {
  getPlacementFormOptions,
  getPlacementInventory,
  getPlacementTypes,
  listAdminPlacements,
  type AdminPlacement,
} from "@/lib/services/category-placements-admin";
import { emptyPlacementMetrics, getPlacementMetrics } from "@/lib/services/placement-metrics";
import { formatCents } from "@/lib/utils";

export const metadata = { title: "Publicidade por categoria — Cerâmica Hub" };

const SECTIONS: { title: string; hint: string; states: AdminPlacement["liveState"][] }[] = [
  { title: "No ar e vencendo", hint: "Aparecem hoje para o visitante.", states: ["no_ar", "vencendo"] },
  { title: "Aguardando liberação ou agendadas", hint: "Reservadas, sem pagamento confirmado ou com início futuro.", states: ["aguardando", "agendada"] },
  { title: "Suspensas", hint: "Pausadas manualmente.", states: ["suspensa"] },
  { title: "Encerradas", hint: "Venceram ou foram canceladas: a empresa já voltou à listagem orgânica.", states: ["encerrada"] },
];

function SummaryCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white/70 p-4">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-muted/70">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-[12px] text-muted">{hint}</p>}
    </div>
  );
}

export default async function CategoryPlacementsPage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "comercial", "marketing"]);
  const [types, placements, options, metrics] = await Promise.all([
    getPlacementTypes(),
    listAdminPlacements(),
    getPlacementFormOptions(),
    getPlacementMetrics(),
  ]);
  const inventory = await getPlacementInventory(types, placements);

  const live = placements.filter((p) => p.liveState === "no_ar" || p.liveState === "vencendo");
  const waiting = placements.filter((p) => p.liveState === "aguardando" || p.liveState === "agendada");
  const expiringSoon = placements.filter((p) => p.liveState === "vencendo");
  // valor do período contratado das posições no ar (referência de receita, não MRR exato)
  const liveValueCents = live.reduce((sum, p) => sum + (p.amountCents ?? 0), 0);

  return (
    <AdminShell currentPath="/admin/publicidade/categorias" adminRole={adminRole} wide>
      <div>
        <Link href="/admin/publicidade" className="tap text-[14px] text-muted hover:text-primary">
          ← Publicidade
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Publicidade por categoria</h1>
        <p className="mt-2 max-w-3xl text-[16px] text-muted">
          Venda as posições Líder, Premium e Destaque de cada categoria e subcategoria. A empresa só aparece quando a posição está ativa, paga e dentro do período; ao vencer, volta sozinha para a listagem orgânica. Os preços ficam em{" "}
          <Link href="/admin/produtos" className="underline">
            Produtos
          </Link>
          .
          Foto, textos e painel comercial de cada vitrine:{" "}
          <Link href="/admin/publicidade/categorias/conteudo" className="underline">
            Conteúdo das categorias
          </Link>
          .
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="No ar agora" value={String(live.length)} hint={`${expiringSoon.length} vencem em até 7 dias`} />
        <SummaryCard label="Aguardando" value={String(waiting.length)} hint="Pagamento ou início pendente" />
        <SummaryCard label="Valor das posições no ar" value={formatCents(liveValueCents)} hint="Soma dos períodos contratados" />
        <SummaryCard label="Total de contratações" value={String(placements.length)} />
      </section>

      <CategoryPlacementForm options={options} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Vagas por categoria hoje</h2>
        <div className="overflow-x-auto rounded-2xl border border-border bg-white/70">
          <table className="w-full min-w-[520px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-border text-[12px] uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-semibold">Categoria</th>
                {types.map((type) => (
                  <th key={type.id} className="px-4 py-3 font-semibold">
                    {type.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inventory.map((row) => (
                <tr key={row.categoryId} className="border-b border-border/60 last:border-0">
                  <td className={`px-4 py-2.5 text-foreground ${row.level === 2 ? "pl-8" : "font-medium"}`}>{row.label.split(" › ").pop()}</td>
                  {row.cells.map((cell) => {
                    const free = cell.maxSlots - cell.occupied;
                    return (
                      <td key={cell.typeId} className="px-4 py-2.5">
                        <span className={free === 0 ? "font-medium text-primary" : "text-muted"}>
                          {cell.occupied}/{cell.maxSlots}
                        </span>
                        <span className="ml-2 text-[12px] text-muted">{free === 0 ? "lotado" : `${free} livre${free > 1 ? "s" : ""}`}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {placements.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border bg-white/40 p-6 text-center text-[15px] text-muted">
          Nenhuma posição vendida ainda. Use “Nova posição de destaque” para reservar a primeira.
        </p>
      )}

      {SECTIONS.map((section) => {
        const rows = placements.filter((p) => section.states.includes(p.liveState));
        if (rows.length === 0) return null;
        return (
          <section key={section.title} className="flex flex-col gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {section.title} <span className="text-[14px] font-normal text-muted">({rows.length})</span>
              </h2>
              <p className="text-[13px] text-muted">{section.hint}</p>
            </div>
            {rows.map((placement) => (
              <CategoryPlacementRow key={placement.id} placement={placement} metrics={metrics.get(placement.id) ?? emptyPlacementMetrics()} />
            ))}
          </section>
        );
      })}
    </AdminShell>
  );
}
