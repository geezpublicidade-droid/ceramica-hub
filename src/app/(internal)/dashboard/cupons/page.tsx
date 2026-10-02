import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getBusinessCouponStats } from "@/lib/services/coupon-claims";
import { normalizeClaimToken } from "@/lib/services/coupon-token";
import { formatDateTimeBR } from "@/lib/utils";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { BackLink } from "@/components/nav/BackLink";
import { CouponValidator } from "@/components/dashboard/CouponValidator";

export const metadata = { title: "Cupons — Cerâmica Hub" };
export const dynamic = "force-dynamic";

const conversion = (used: number, issued: number) => (issued === 0 ? "—" : `${Math.round((used / issued) * 100)}%`);

export default async function DashboardCouponsPage({ searchParams }: { searchParams: Promise<{ validar?: string }> }) {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) redirect("/login");

  const { validar } = await searchParams;
  const { benefits, recent } = await getBusinessCouponStats(businessId);

  return (
    <main className="min-h-screen px-6 py-16 lg:py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <aside className="lg:sticky lg:top-10 lg:w-64 lg:shrink-0">
          <DashboardNav currentPath="/dashboard/cupons" />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col gap-6 lg:max-w-3xl">
          <div className="mb-2">
            <BackLink href="/dashboard" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Cupons</h1>
            <p className="mt-2 text-[16px] text-muted">Valide os cupons dos clientes e acompanhe quantos viram venda no balcão.</p>
          </div>

          <CouponValidator initialToken={normalizeClaimToken(validar) ?? ""} />

          <section>
            <h2 className="text-[18px] font-semibold text-foreground">Desempenho por cupom</h2>
            {benefits.length === 0 ? (
              <p className="mt-2 text-[15px] text-muted">Você ainda não tem promoções com cupom. Crie uma em “Promoções”.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {benefits.map((benefit) => (
                  <li key={benefit.benefitId} className="rounded-2xl border border-border bg-white/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[15px] font-medium text-foreground">{benefit.title}</p>
                      {!benefit.active && <span className="text-[12px] text-muted">Encerrada</span>}
                    </div>
                    <p className="mt-1 text-[14px] text-muted">
                      {benefit.issued} emitidos{benefit.maxTotalUses ? ` de ${benefit.maxTotalUses}` : ""} · {benefit.used} utilizados · conversão{" "}
                      <strong className="text-foreground">{conversion(benefit.used, benefit.issued)}</strong>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-foreground">Últimos resgates</h2>
            {recent.length === 0 ? (
              <p className="mt-2 text-[15px] text-muted">Nenhum cupom resgatado ainda.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {recent.map((claim) => (
                  <li key={claim.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-white/70 px-4 py-3">
                    <div>
                      <p className="text-[14px] font-medium text-foreground">{claim.memberName}</p>
                      <p className="text-[13px] text-muted">
                        {claim.benefitTitle} · {formatDateTimeBR(claim.claimedAt)}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${claim.status === "utilizado" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {claim.status === "utilizado" ? "Utilizado" : "Aguardando uso"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
