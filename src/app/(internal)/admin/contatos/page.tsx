import { requireAdminPage } from "@/lib/auth-guards";
import { createServiceClient } from "@/lib/supabase/server";
import { getAllContactsForAdmin } from "@/lib/services/contacts";
import { NewContactForm } from "@/components/admin/NewContactForm";
import { ContactFilters } from "@/components/admin/ContactFilters";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = { title: "Contatos — Cerâmica Hub" };

async function getBusinessesForSelect() {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("businesses").select("id, name").order("name");
  if (error) throw error;
  return (data ?? []) as { id: string; name: string }[];
}

export default async function AdminContactsPage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "comercial", "atendimento"]);
  const [contacts, businesses] = await Promise.all([getAllContactsForAdmin(), getBusinessesForSelect()]);

  return (
    <AdminShell currentPath="/admin/contatos" adminRole={adminRole} wide>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Contatos</h1>
        <p className="mt-2 text-[16px] text-muted">
          Pessoas de cada empresa que o time fala com — sócio, financeiro, responsável pela loja. Não é login no
          painel da empresa, é só registro comercial (ver aba &quot;Contatos&quot; da Empresa 360°).
        </p>
      </div>

      <NewContactForm businesses={businesses} />

      <section className="flex flex-col gap-3">
        <p className="text-[17px] font-semibold text-foreground">Todos ({contacts.length})</p>
        <ContactFilters contacts={contacts} />
      </section>
    </AdminShell>
  );
}
