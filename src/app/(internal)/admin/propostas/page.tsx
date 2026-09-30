import Link from "next/link";
import { requireAdminPage } from "@/lib/auth-guards";
import { getAllProposals, PROPOSAL_STATUS_LABEL, PROPOSAL_STATUS_ORDER, type ProposalStatus } from "@/lib/services/proposals";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatCents, formatDateBR } from "@/lib/utils";

export const metadata = { title: "Propostas — Cerâmica Hub" };

const STATUS_CLASS: Record<ProposalStatus, string> = {
  rascunho: "bg-gray-100 text-gray-700",
  enviada: "bg-blue-100 text-blue-700",
  visualizada: "bg-indigo-100 text-indigo-700",
  negociacao: "bg-amber-100 text-amber-700",
  aceita: "bg-green-100 text-green-700",
  recusada: "bg-red-100 text-red-700",
  vencida: "bg-orange-100 text-orange-700",
};

export default async function AdminProposalsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "comercial"]);
  const { status } = await searchParams;
  const proposals = await getAllProposals();
  const filter = PROPOSAL_STATUS_ORDER.find((candidate) => candidate === status);
  const visible = filter ? proposals.filter((proposal) => proposal.status === filter) : proposals;

  return (
    <AdminShell currentPath="/admin/propostas" adminRole={adminRole} wide>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Propostas</h1>
          <p className="mt-2 text-[16px] text-muted">Propostas comerciais de leads e empresas, do rascunho ao aceite.</p>
        </div>
        <Link href="/admin/propostas/nova" className="neu-primary rounded-full px-5 py-2.5 text-[14px] font-medium text-white">
          + Nova proposta
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/propostas" className={`rounded-full px-3 py-1 text-[13px] ${filter ? "neu text-foreground" : "neu-primary text-white"}`}>
          Todas ({proposals.length})
        </Link>
        {PROPOSAL_STATUS_ORDER.map((option) => (
          <Link
            key={option}
            href={`/admin/propostas?status=${option}`}
            className={`rounded-full px-3 py-1 text-[13px] ${filter === option ? "neu-primary text-white" : "neu text-foreground"}`}
          >
            {PROPOSAL_STATUS_LABEL[option]} ({proposals.filter((proposal) => proposal.status === option).length})
          </Link>
        ))}
      </div>

      <section className="flex flex-col gap-3">
        {visible.length === 0 && <p className="text-[16px] text-muted">Nenhuma proposta por aqui.</p>}
        {visible.map((proposal) => (
          <Link
            key={proposal.id}
            href={`/admin/propostas/${proposal.id}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white/70 p-4"
          >
            <div>
              <p className="text-[16px] font-medium text-foreground">
                #{proposal.number} · {proposal.clientName}
              </p>
              <p className="text-[13px] text-muted">
                {proposal.items.length} item(ns)
                {proposal.validUntil && ` · válida até ${formatDateBR(proposal.validUntil)}`}
                {proposal.ownerEmail && ` · ${proposal.ownerEmail}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[16px] font-semibold text-foreground">{formatCents(proposal.totalCents)}</span>
              <StatusBadge label={PROPOSAL_STATUS_LABEL[proposal.status]} className={STATUS_CLASS[proposal.status]} />
            </div>
          </Link>
        ))}
      </section>
    </AdminShell>
  );
}
