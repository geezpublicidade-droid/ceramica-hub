import { requireAdminPage } from "@/lib/auth-guards";
import { createServiceClient } from "@/lib/supabase/server";
import { getAllProducts } from "@/lib/services/products";
import { getAssignableAdmins } from "@/lib/services/admins";
import { getLeadById } from "@/lib/services/leads";
import { ProposalForm, type ProposalFormInitial } from "@/components/admin/ProposalForm";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = { title: "Nova proposta — Cerâmica Hub" };

const EMPTY_INITIAL: ProposalFormInitial = {
  leadId: null,
  businessId: null,
  clientName: "",
  clientEmail: "",
  validUntil: "",
  discountPercent: "0",
  discountReais: "0,00",
  terms: "",
  notes: "",
  ownerAdminId: "",
  items: [],
};

/** Pré-preenche cliente/contato a partir de ?leadId= ou ?businessId=. */
async function resolveInitial(leadId?: string, businessId?: string): Promise<ProposalFormInitial> {
  if (leadId) {
    const lead = await getLeadById(leadId);
    if (lead) {
      return {
        ...EMPTY_INITIAL,
        leadId: lead.id,
        businessId: lead.convertedBusinessId,
        clientName: lead.companyName ?? lead.contactName,
        clientEmail: lead.email ?? "",
        ownerAdminId: lead.ownerAdminId ?? "",
      };
    }
  }
  if (businessId) {
    const supabase = createServiceClient();
    const { data } = await supabase.from("businesses").select("id, name, email").eq("id", businessId).maybeSingle();
    if (data) return { ...EMPTY_INITIAL, businessId: data.id, clientName: data.name, clientEmail: data.email };
  }
  return EMPTY_INITIAL;
}

export default async function NewProposalPage({ searchParams }: { searchParams: Promise<{ leadId?: string; businessId?: string }> }) {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "comercial"]);
  const { leadId, businessId } = await searchParams;
  const [products, admins, initial] = await Promise.all([getAllProducts({ onlyActive: true }), getAssignableAdmins(), resolveInitial(leadId, businessId)]);

  return (
    <AdminShell currentPath="/admin/propostas" adminRole={adminRole} wide>
      <h1 className="text-2xl font-semibold text-foreground">Nova proposta</h1>
      <ProposalForm products={products} admins={admins} initial={initial} />
    </AdminShell>
  );
}
