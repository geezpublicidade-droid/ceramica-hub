import { requireAdminPage } from "@/lib/auth-guards";
import { createServiceClient } from "@/lib/supabase/server";
import { getAllMeetingSpacesForAdmin } from "@/lib/services/meeting-spaces";
import { NewMeetingSpaceForm } from "@/components/admin/NewMeetingSpaceForm";
import { MeetingSpaceRow } from "@/components/admin/MeetingSpaceRow";
import { BackLink } from "@/components/nav/BackLink";

export const metadata = { title: "Auditórios e salas — Cerâmica Hub" };

async function getTowers() {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("towers").select("id, name").eq("active", true).order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export default async function AdminAuditoriosPage() {
  await requireAdminPage(["super_admin", "admin"]);
  const [spaces, towers] = await Promise.all([getAllMeetingSpacesForAdmin(), getTowers()]);

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Auditórios e salas de reunião</h1>
            <p className="mt-2 text-[16px] text-muted">
              Sem reserva automática — o contato (WhatsApp/link) é só pra solicitar informação e disponibilidade.
            </p>
          </div>
          <BackLink href="/admin" />
        </div>

        <div className="mt-10">
          <NewMeetingSpaceForm towers={towers} />
        </div>

        <section className="mt-10 flex flex-col gap-3">
          <p className="text-[17px] font-semibold text-foreground">Espaços ({spaces.length})</p>
          {spaces.length === 0 && <p className="text-[15px] text-muted">Nenhum espaço cadastrado ainda.</p>}
          {spaces.map((space) => (
            <MeetingSpaceRow key={space.id} space={space} />
          ))}
        </section>
      </div>
    </main>
  );
}
