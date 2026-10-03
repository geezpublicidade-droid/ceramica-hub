import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth-guards";
import {
  getAnchorPartnerById,
  getContractsWithDeliverables,
  getDeliverableProgress,
  CONTRACT_STATUS_LABEL,
  DELIVERABLE_STATUS_LABEL,
} from "@/lib/services/anchors";
import { formatCents, formatDateBR } from "@/lib/utils";
import { PrintButton } from "@/components/dashboard/PrintButton";

export const metadata = { title: "Relatório de entregas — Cerâmica Hub" };

/** Relatório imprimível (salvar em PDF) do que foi entregue e do que falta por contrato da âncora. */
export default async function AnchorReportPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage(["super_admin", "admin", "comercial"]);
  const { id } = await params;
  const partner = await getAnchorPartnerById(id);
  if (!partner) notFound();
  const contracts = await getContractsWithDeliverables(id);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16 print:py-6">
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/admin/parceiros/${id}`} className="text-[15px] text-muted hover:text-foreground">
          ← Voltar
        </Link>
        <PrintButton />
      </div>

      <header className="mt-8 print:mt-0">
        <p className="text-[14px] uppercase tracking-[0.15em] text-muted">Relatório de entregas · Cerâmica Hub</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">{partner.name}</h1>
        <p className="mt-1 text-[16px] text-muted">Emitido em {formatDateBR(new Date().toISOString().slice(0, 10))}</p>
      </header>

      {contracts.length === 0 && <p className="mt-8 text-[15px] text-muted">Nenhum contrato cadastrado.</p>}

      {contracts.map((contract) => {
        const progress = getDeliverableProgress(contract.deliverables);
        return (
          <section key={contract.id} className="mt-10 break-inside-avoid">
            <h2 className="text-[18px] font-semibold text-foreground">
              Contrato {formatDateBR(contract.startsOn)} a {formatDateBR(contract.endsOn)} · {CONTRACT_STATUS_LABEL[contract.status]}
              {contract.valueCents != null && ` · ${formatCents(contract.valueCents)}`}
            </h2>
            <p className="mt-1 text-[15px] text-muted">
              {progress.done} de {progress.total} entregas realizadas ({progress.percentage}%)
              {progress.overdue > 0 && ` · ${progress.overdue} atrasada(s)`}
            </p>
            <div className="overflow-x-auto">
              <table className="mt-4 w-full border-collapse text-left text-[14px]">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="py-2 font-medium">Entrega</th>
                  <th className="py-2 font-medium">Prazo</th>
                  <th className="py-2 font-medium">Situação</th>
                  <th className="py-2 font-medium">Comprovação</th>
                </tr>
              </thead>
              <tbody>
                {contract.deliverables.map((deliverable) => (
                  <tr key={deliverable.id} className="border-b border-border">
                    <td className="py-2 text-foreground">{deliverable.title}</td>
                    <td className="py-2 text-muted">{deliverable.dueOn ? formatDateBR(deliverable.dueOn) : "—"}</td>
                    <td className="py-2 text-foreground">
                      {DELIVERABLE_STATUS_LABEL[deliverable.status]}
                      {deliverable.deliveredOn && ` em ${formatDateBR(deliverable.deliveredOn)}`}
                    </td>
                    <td className="py-2 text-muted">{deliverable.evidenceUrl ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </section>
        );
      })}
    </main>
  );
}
