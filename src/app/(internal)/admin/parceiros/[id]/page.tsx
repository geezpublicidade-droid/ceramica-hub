import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth-guards";
import { getAnchorPartnerById, getAnchorStores, getContractsWithDeliverables } from "@/lib/services/anchors";
import { AdminShell } from "@/components/admin/AdminShell";
import { AnchorPageForm } from "@/components/admin/AnchorPageForm";
import { AnchorContractPanel } from "@/components/admin/AnchorContractPanel";
import { AnchorStoresPanel } from "@/components/admin/AnchorStoresPanel";

export const metadata = { title: "Parceiro âncora — Cerâmica Hub" };

export default async function AnchorPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "comercial"]);
  const { id } = await params;
  const partner = await getAnchorPartnerById(id);
  if (!partner) notFound();

  const [contracts, stores] = await Promise.all([getContractsWithDeliverables(id), getAnchorStores(id, { onlyActive: false })]);

  return (
    <AdminShell currentPath="/admin/parceiros" adminRole={adminRole}>
      <div>
        <Link href="/admin/parceiros" className="text-[14px] text-muted hover:text-foreground">
          ← Parceiros
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">{partner.name}</h1>
        <p className="mt-1 text-[15px] text-muted">
          {partner.partnershipType} · status: {partner.status}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`/admin/parceiros/${id}/relatorio`} className="neu rounded-full px-4 py-2 text-[14px] font-medium text-foreground">
            Relatório de entregas
          </Link>
          {partner.hasPage && partner.slug && partner.status === "ativo" && (
            <Link href={`/parceiros/${partner.slug}`} target="_blank" className="neu rounded-full px-4 py-2 text-[14px] font-medium text-foreground">
              Ver página pública
            </Link>
          )}
        </div>
      </div>

      <AnchorPageForm partner={partner} />
      <AnchorContractPanel partnerId={id} contracts={contracts} />
      {partner.hasPage && <AnchorStoresPanel partnerId={id} stores={stores} />}
    </AdminShell>
  );
}
