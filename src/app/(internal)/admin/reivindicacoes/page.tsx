import { requireAdminPage } from "@/lib/auth-guards";
import { createServiceClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { ClaimsList, type ClaimRow } from "@/components/admin/plan/ClaimsList";

export const metadata = { title: "Reivindicações de perfil — Cerâmica Hub" };
export const dynamic = "force-dynamic";

export default async function AdminClaimsPage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "comercial"]);
  const { data } = await createServiceClient()
    .from("profile_claims")
    .select("id, claimant_name, claimant_email, claimant_phone, role_in_company, message, status, created_at, review_note, businesses(name, slug)")
    .order("created_at", { ascending: false })
    .limit(100);

  const claims: ClaimRow[] = (data ?? []).map((row) => {
    const business = row.businesses as unknown as { name: string; slug: string | null } | null;
    return {
      id: row.id,
      businessName: business?.name ?? "Empresa removida",
      businessSlug: business?.slug ?? null,
      name: row.claimant_name,
      email: row.claimant_email,
      phone: row.claimant_phone,
      role: row.role_in_company,
      message: row.message,
      status: row.status,
      createdAt: row.created_at,
      reviewNote: row.review_note,
    };
  });

  return (
    <AdminShell currentPath="/admin/reivindicacoes" adminRole={adminRole}>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Reivindicações de perfil</h1>
        <p className="mt-1 text-[15px] text-muted">
          Pedidos de quem diz representar uma empresa cujo perfil ainda não tem proprietário validado. Aprovar libera o acesso; recusar não altera o perfil.
        </p>
      </div>
      <ClaimsList claims={claims} />
    </AdminShell>
  );
}
