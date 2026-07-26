import { requireAdminPage } from "@/lib/auth-guards";
import { createServiceClient } from "@/lib/supabase/server";
import { NewAdminForm } from "@/components/admin/NewAdminForm";
import { AdminUserRow } from "@/components/admin/AdminUserRow";
import { BackLink } from "@/components/nav/BackLink";
import type { AdminRole } from "@/auth";

export const metadata = { title: "Usuários — Cerâmica Hub" };

export default async function AdminUsuariosPage() {
  const { adminId } = await requireAdminPage(["super_admin"]);

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("admins")
    .select("id, email, role")
    .order("email", { ascending: true });
  if (error) throw error;
  const admins = (data ?? []) as { id: string; email: string; role: AdminRole }[];

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Usuários administrativos</h1>
            <p className="mt-2 text-[16px] text-muted">
              Cada papel só acessa a área correspondente. Super admin tem acesso total.
            </p>
          </div>
          <BackLink href="/admin" />
        </div>

        <div className="mt-10">
          <NewAdminForm />
        </div>

        <section className="mt-10 flex flex-col gap-3">
          <p className="text-[17px] font-semibold text-foreground">Admins ({admins.length})</p>
          {admins.map((admin) => (
            <AdminUserRow key={admin.id} admin={admin} isSelf={admin.id === adminId} />
          ))}
        </section>
      </div>
    </main>
  );
}
