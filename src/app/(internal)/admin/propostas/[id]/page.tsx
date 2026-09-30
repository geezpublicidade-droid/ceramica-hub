import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { requireAdminPage } from "@/lib/auth-guards";
import { getAllProducts } from "@/lib/services/products";
import { getAssignableAdmins } from "@/lib/services/admins";
import {
  FINAL_STATUSES,
  PROPOSAL_STATUS_LABEL,
  getProposalById,
  getProposalEvents,
  type Proposal,
} from "@/lib/services/proposals";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProposalForm, type ProposalFormInitial } from "@/components/admin/ProposalForm";
import { ProposalStatusActions } from "@/components/admin/ProposalStatusActions";
import { ProposalDocument } from "@/components/proposals/ProposalDocument";

export const metadata = { title: "Proposta — Cerâmica Hub" };

function toInitial(proposal: Proposal): ProposalFormInitial {
  return {
    leadId: proposal.leadId,
    businessId: proposal.businessId,
    clientName: proposal.clientName,
    clientEmail: proposal.clientEmail ?? "",
    validUntil: proposal.validUntil ?? "",
    discountPercent: String(proposal.discountPercent).replace(".", ","),
    discountReais: (proposal.discountCents / 100).toFixed(2).replace(".", ","),
    terms: proposal.terms ?? "",
    notes: proposal.notes ?? "",
    ownerAdminId: proposal.ownerAdminId ?? "",
    items: proposal.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      period: item.period,
      price: (item.unitPriceCents / 100).toFixed(2).replace(".", ","),
      quantity: String(item.quantity),
    })),
  };
}

export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "comercial"]);
  const { id } = await params;
  const proposal = await getProposalById(id);
  if (!proposal) notFound();

  const [events, products, admins, host] = await Promise.all([
    getProposalEvents(id),
    getAllProducts({ onlyActive: true }),
    getAssignableAdmins(),
    headers().then((h) => h.get("host")),
  ]);
  const publicUrl = `${host?.startsWith("localhost") ? "http" : "https"}://${host}/proposta/${proposal.publicToken}`;
  const editable = !FINAL_STATUSES.includes(proposal.status);

  return (
    <AdminShell currentPath="/admin/propostas" adminRole={adminRole} wide>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/propostas" className="text-[13px] text-muted">
            ← Propostas
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">
            Proposta #{proposal.number} — {PROPOSAL_STATUS_LABEL[proposal.status]}
          </h1>
        </div>
      </div>

      <ProposalStatusActions proposalId={proposal.id} status={proposal.status} />

      {proposal.status !== "rascunho" && (
        <div className="rounded-2xl border border-border bg-white/70 p-4 text-[14px]">
          <p className="font-medium text-foreground">Link para o cliente (visualizar e baixar PDF)</p>
          <p className="mt-1 break-all text-muted">{publicUrl}</p>
        </div>
      )}
      {proposal.status === "rascunho" && (
        <p className="text-[14px] text-muted">O link para o cliente é liberado quando a proposta for marcada como enviada.</p>
      )}

      <ProposalDocument proposal={proposal} />

      {editable && (
        <details className="rounded-2xl">
          <summary className="cursor-pointer text-[15px] font-medium text-foreground">Editar proposta</summary>
          <div className="mt-4">
            <ProposalForm products={products} admins={admins} initial={toInitial(proposal)} proposalId={proposal.id} />
          </div>
        </details>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">Histórico</h2>
        {events.map((event) => (
          <p key={event.id} className="text-[14px] text-foreground">
            <span className="text-muted">{new Date(event.createdAt).toLocaleString("pt-BR")}</span> · {event.detail ?? event.eventType}
            {event.adminEmail && <span className="text-muted"> ({event.adminEmail})</span>}
          </p>
        ))}
      </section>
    </AdminShell>
  );
}
