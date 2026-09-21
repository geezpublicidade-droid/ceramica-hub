import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listOwnedTickets } from "@/lib/services/support";
import { BackLink } from "@/components/nav/BackLink";
import { NewTicketForm } from "@/components/support/NewTicketForm";
import { SupportTicketList } from "@/components/support/SupportTicketList";

export const metadata = { title: "Suporte — Cerâmica Hub" };

export default async function MemberSuportePage() {
  const session = await auth();
  const memberId = session?.user?.memberId;
  if (!memberId) redirect("/membro/login");

  const tickets = await listOwnedTickets({ type: "member", id: memberId });

  return (
    <main className="min-h-screen px-6 py-24">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="mb-2">
          <BackLink href="/membro" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Suporte</h1>
          <p className="mt-2 text-[16px] text-muted">Tire dúvidas sobre sua conta ou o Cerâmica Hub — o histórico fica salvo aqui.</p>
        </div>

        <NewTicketForm defaultName={session?.user?.name ?? ""} defaultContact={session?.user?.email ?? ""} />

        <section className="flex flex-col gap-3">
          <p className="text-[17px] font-semibold text-foreground">Seus chamados ({tickets.length})</p>
          <SupportTicketList tickets={tickets} basePath="/membro/suporte" />
        </section>
      </div>
    </main>
  );
}
