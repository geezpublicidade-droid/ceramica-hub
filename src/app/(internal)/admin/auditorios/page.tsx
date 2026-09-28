import { requireAdminPage } from "@/lib/auth-guards";
import { createServiceClient } from "@/lib/supabase/server";
import { getAllMeetingSpacesForAdmin } from "@/lib/services/meeting-spaces";
import { NewMeetingSpaceForm } from "@/components/admin/NewMeetingSpaceForm";
import { MeetingSpaceRow } from "@/components/admin/MeetingSpaceRow";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = { title: "Auditórios e salas — Cerâmica Hub" };

async function getTowers() {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("towers").select("id, name").eq("active", true).order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export default async function AdminAuditoriosPage() {
  const { adminRole } = await requireAdminPage(["super_admin", "admin"]);
  const [spaces, towers] = await Promise.all([getAllMeetingSpacesForAdmin(), getTowers()]);

  return (
    <AdminShell currentPath="/admin/auditorios" adminRole={adminRole}>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Auditórios e salas de reunião</h1>
        <p className="mt-2 text-[16px] text-muted">
          Sem reserva automática — o contato (WhatsApp/link) é só pra solicitar informação e disponibilidade.
        </p>
      </div>

      <NewMeetingSpaceForm towers={towers} />

      <section className="flex flex-col gap-3">
        <p className="text-[17px] font-semibold text-foreground">Espaços ({spaces.length})</p>
        {spaces.length === 0 && <p className="text-[15px] text-muted">Nenhum espaço cadastrado ainda.</p>}
        {spaces.map((space) => (
          <MeetingSpaceRow key={space.id} space={space} />
        ))}
      </section>
    </AdminShell>
  );
}
