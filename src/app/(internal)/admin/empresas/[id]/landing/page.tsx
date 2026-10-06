import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdminPage } from "@/lib/auth-guards";
import { getBusinessById, UUID_RE } from "@/lib/services/platform";
import { getLandingEditorData } from "@/lib/services/landing-editor-data";
import { AdminShell } from "@/components/admin/AdminShell";
import { LandingEditor } from "@/components/dashboard/landing/LandingEditor";

export const metadata = { title: "Landing page da empresa — Cerâmica Hub" };

export default async function AdminCompanyLandingPage({ params }: { params: Promise<{ id: string }> }) {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "comercial", "marketing", "conteudo"]);
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const business = await getBusinessById(id);
  if (!business) notFound();
  const data = await getLandingEditorData(business);

  return (
    <AdminShell currentPath="/admin/empresas" adminRole={adminRole} wide>
      <div>
        <p className="text-[13px] font-medium uppercase tracking-wide text-muted">
          <Link href="/admin/empresas" className="text-primary underline">
            Empresas
          </Link>{" "}
          /{" "}
          <Link href={`/admin/empresas/${id}`} className="text-primary underline">
            {business.name}
          </Link>{" "}
          / Landing page
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Landing page — {business.name}</h1>
        <p className="mt-1 text-[14px] text-muted">Plano atual: {business.effectivePlan}. As alterações ficam registradas na auditoria.</p>
      </div>
      <LandingEditor data={data} target={id} previewHref={`/empresa/${business.slug}/preview`} publicHref={`/empresa/${business.slug}`} />
    </AdminShell>
  );
}
