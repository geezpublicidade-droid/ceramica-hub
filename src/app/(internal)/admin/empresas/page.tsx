import Link from "next/link";
import { requireAdminPage } from "@/lib/auth-guards";
import { listCompaniesForAdmin } from "@/lib/services/companies";
import { CompanyDirectory } from "@/components/admin/CompanyDirectory";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = { title: "Empresas — Cerâmica Hub" };

export default async function AdminCompaniesPage() {
  const { adminRole } = await requireAdminPage([
    "super_admin",
    "admin",
    "moderador",
    "comercial",
    "financeiro",
    "marketing",
    "atendimento",
    "analista",
  ]);
  const companies = await listCompaniesForAdmin();

  return (
    <AdminShell currentPath="/admin/empresas" adminRole={adminRole} wide>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Empresas</h1>
        <p className="mt-2 text-[16px] text-muted">
          Diretório completo — clique numa empresa pra ver a visão 360° (contatos, plano, financeiro, publicidade,
          métricas, atendimento e histórico). Aprovar/rejeitar cadastro continua no{" "}
          <Link href="/admin" className="text-primary underline">
            dashboard
          </Link>
          .
        </p>
      </div>

      <CompanyDirectory companies={companies} />
    </AdminShell>
  );
}
