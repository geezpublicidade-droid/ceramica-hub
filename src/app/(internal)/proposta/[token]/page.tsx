import { notFound } from "next/navigation";
import { getProposalByToken, markProposalViewed } from "@/lib/services/proposals";
import { ProposalDocument } from "@/components/proposals/ProposalDocument";
import { PrintButton } from "@/components/proposals/PrintButton";

export const metadata = { title: "Proposta — Cerâmica Hub", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Link público da proposta (acesso pelo token secreto). Rascunhos não são
 * exibidos; a primeira abertura de uma proposta "enviada" a marca como
 * "visualizada". */
export default async function PublicProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const proposal = await getProposalByToken(token);
  if (!proposal || proposal.status === "rascunho") notFound();

  await markProposalViewed(proposal.id, proposal.status);

  return (
    <main className="flex flex-1 flex-col items-center gap-6 bg-background px-4 py-10 print:p-0">
      <ProposalDocument proposal={proposal} />
      <PrintButton />
    </main>
  );
}
