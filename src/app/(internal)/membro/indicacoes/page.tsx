import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getReferralSummary } from "@/lib/services/referrals";
import { BackLink } from "@/components/nav/BackLink";
import { ReferralPanel } from "@/components/referrals/ReferralPanel";

export const metadata = { title: "Indicações — Cerâmica Hub" };
export const dynamic = "force-dynamic";

export default async function MemberReferralsPage() {
  const session = await auth();
  const memberId = session?.user?.memberId;
  if (!memberId) redirect("/membro/login");

  const summary = await getReferralSummary("member", memberId);

  return (
    <main className="min-h-screen px-6 py-24">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <BackLink href="/membro" />
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Indicar uma empresa</h1>
          <p className="mt-2 text-[16px] text-muted">
            Conhece uma empresa que deveria estar no Cerâmica Hub? Compartilhe seu link. Quando ela virar cliente, a equipe combina sua recompensa.
          </p>
        </div>
        <ReferralPanel summary={summary} />
      </div>
    </main>
  );
}
