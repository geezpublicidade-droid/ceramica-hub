import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getBusinessById } from "@/lib/services/platform";
import { listOwnedTickets } from "@/lib/services/support";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { BackLink } from "@/components/nav/BackLink";
import { NewTicketForm } from "@/components/support/NewTicketForm";
import { SupportTicketList } from "@/components/support/SupportTicketList";

export const metadata = { title: "Suporte — Cerâmica Hub" };

export default async function DashboardSuportePage() {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) redirect("/login");

  const business = await getBusinessById(businessId);
  if (!business) redirect("/login");

  const tickets = await listOwnedTickets({ type: "business", id: businessId });

  return (
    <main className="min-h-screen px-6 py-16 lg:py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <aside className="lg:sticky lg:top-10 lg:w-64 lg:shrink-0">
          <DashboardNav currentPath="/dashboard/suporte" />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6 lg:max-w-3xl">
          <div className="mb-2">
            <BackLink href="/dashboard" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Suporte</h1>
            <p className="mt-2 text-[16px] text-muted">
              Tire dúvidas sobre seu plano, sua página ou o painel — o histórico fica salvo aqui.
            </p>
          </div>

          <NewTicketForm defaultName={business.name} defaultContact={session?.user?.email ?? ""} />

          <section className="flex flex-col gap-3">
            <p className="text-[17px] font-semibold text-foreground">Seus chamados ({tickets.length})</p>
            <SupportTicketList tickets={tickets} basePath="/dashboard/suporte" />
          </section>
        </div>
      </div>
    </main>
  );
}
