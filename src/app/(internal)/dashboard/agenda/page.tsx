import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { BackLink } from "@/components/nav/BackLink";
import { AgendaCalendar } from "@/components/dashboard/agenda/AgendaCalendar";
import { addDays } from "@/lib/ad-schedule";
import { monthKey, shiftMonth } from "@/lib/agenda";
import { getAgendaItems } from "@/lib/services/agenda-data";

export const metadata = { title: "Agenda de divulgação — Cerâmica Hub" };
export const dynamic = "force-dynamic";

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) redirect("/login");

  const today = new Date().toISOString().slice(0, 10);
  const requested = (await searchParams).mes;
  const month = requested && /^\d{4}-(0[1-9]|1[0-2])$/.test(requested) ? requested : monthKey(today);
  // pega a grade inteira (o calendário mostra dias dos meses vizinhos)
  const items = await getAgendaItems(businessId, addDays(`${month}-01`, -7), addDays(`${shiftMonth(month, 1)}-01`, 7));

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <aside className="lg:sticky lg:top-10 lg:w-64 lg:shrink-0">
          <DashboardNav currentPath="/dashboard/agenda" />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col gap-6 lg:max-w-3xl">
          <div>
            <BackLink href="/dashboard" />
            <h1 className="mt-4 text-2xl font-semibold text-foreground">Agenda de divulgação</h1>
            <p className="mt-2 text-[16px] text-muted">
              Anúncios, publicações, promoções, destaques em categoria e eventos do Hub num só calendário. Para reservar novas datas, abra Anunciar.
            </p>
          </div>
          <AgendaCalendar month={month} items={items} today={today} />
        </div>
      </div>
    </main>
  );
}
