import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getReferralSummary } from "@/lib/services/referrals";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { BackLink } from "@/components/nav/BackLink";
import { ReferralPanel } from "@/components/referrals/ReferralPanel";

export const metadata = { title: "Indicações — Cerâmica Hub" };
export const dynamic = "force-dynamic";

export default async function DashboardReferralsPage() {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) redirect("/login");

  const summary = await getReferralSummary("business", businessId);

  return (
    <main className="min-h-screen px-6 py-16 lg:py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <aside className="lg:sticky lg:top-10 lg:w-64 lg:shrink-0">
          <DashboardNav currentPath="/dashboard/indicacoes" />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col gap-6 lg:max-w-3xl">
          <div className="mb-2">
            <BackLink href="/dashboard" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Indicações</h1>
            <p className="mt-2 text-[16px] text-muted">
              Indique outra empresa para o Cerâmica Hub. Quando ela virar cliente, a equipe combina sua recompensa.
            </p>
          </div>
          <ReferralPanel summary={summary} />
        </div>
      </div>
    </main>
  );
}
