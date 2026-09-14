import { requireAdminPage } from "@/lib/auth-guards";
import { getAllEventsForAdmin } from "@/lib/services/events";
import { NewEventForm } from "@/components/admin/NewEventForm";
import { EventRow } from "@/components/admin/EventRow";
import { BackLink } from "@/components/nav/BackLink";

export const metadata = { title: "Eventos — Cerâmica Hub" };

export default async function AdminEventosPage() {
  await requireAdminPage(["super_admin", "admin"]);
  const events = await getAllEventsForAdmin();

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Eventos (Fórum de Negócios)</h1>
            <p className="mt-2 text-[16px] text-muted">
              Agenda B2B e ações com âncoras — só publique datas e vagas confirmadas.
            </p>
          </div>
          <BackLink href="/admin" />
        </div>

        <div className="mt-10">
          <NewEventForm />
        </div>

        <section className="mt-10 flex flex-col gap-3">
          <p className="text-[17px] font-semibold text-foreground">Eventos ({events.length})</p>
          {events.length === 0 && <p className="text-[15px] text-muted">Nenhum evento cadastrado ainda.</p>}
          {events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </section>
      </div>
    </main>
  );
}
