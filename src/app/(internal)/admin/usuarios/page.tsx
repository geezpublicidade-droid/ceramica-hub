import { requireAdminPage } from "@/lib/auth-guards";
import { createServiceClient } from "@/lib/supabase/server";
import { NewAdminForm } from "@/components/admin/NewAdminForm";
import { AdminUserRow } from "@/components/admin/AdminUserRow";
import { AdminShell } from "@/components/admin/AdminShell";
import type { AdminRole } from "@/auth";

export const metadata = { title: "Usuários — Cerâmica Hub" };

export default async function AdminUsuariosPage() {
  const { adminId, adminRole } = await requireAdminPage(["super_admin"]);

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("admins")
    .select("id, email, role")
    .order("email", { ascending: true });
  if (error) throw error;
  const admins = (data ?? []) as { id: string; email: string; role: AdminRole }[];

  return (
    <AdminShell currentPath="/admin/usuarios" adminRole={adminRole}>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Usuários administrativos</h1>
        <p className="mt-2 text-[16px] text-muted">
          Cada papel só acessa a área correspondente. Super admin tem acesso total.
        </p>
      </div>

      <NewAdminForm />

      <section className="flex flex-col gap-3">
        <p className="text-[17px] font-semibold text-foreground">Admins ({admins.length})</p>
        {admins.map((admin) => (
          <AdminUserRow key={admin.id} admin={admin} isSelf={admin.id === adminId} />
        ))}
      </section>
    </AdminShell>
  );
}
